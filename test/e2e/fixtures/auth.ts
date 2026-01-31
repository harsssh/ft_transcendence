import fs from 'node:fs'
import path from 'node:path'
import { expect } from '@playwright/test'
import { db } from '../../../app/contexts/db'
import { hashPassword } from '../../../app/routes/_auth+/_shared/password.server'
import {
  commitSession,
  getSession,
} from '../../../app/routes/_auth+/_shared/session.server'
import { users } from '../../../db/schema'
import { test } from '.'
import type { FixturesExtension } from './types'

const AUTH_PASSWORD = 'password'

export type AuthTestWorkerFixtures = {
  authState: string
}

export const authTestFixtures: FixturesExtension<{
  worker: AuthTestWorkerFixtures
}> = {
  storageState: ({ authState }, use) => use(authState),

  authState: [
    async ({ browser }, use) => {
      const id = test.info().parallelIndex
      const fileName = path.resolve(
        test.info().project.outputDir,
        `.auth/worker-${id}.json`,
      )

      if (fs.existsSync(fileName)) {
        await use(fileName)
        return
      }

      // fixtureではconfigで指定したbaseURLが使えないため明示的に指定
      // see: https://github.com/microsoft/playwright/issues/27558
      const host =
        // biome-ignore lint/complexity/useLiteralKeys: うるさい
        process.env['WEBAPP_HOST'] ?? process.env.HOST ?? 'localhost:5173'

      const baseURL = process.env.E2E_BASE_URL ?? `http://${host}`

      const page = await browser.newPage({
        storageState: { cookies: [], origins: [] },
        baseURL,
        ignoreHTTPSErrors: true,
      })

      const account = await acquireUser(id)

      if (!account) throw new Error(`Failed to acquire user: ${id}`)

      // UIログインはモバイル環境でフレークしやすいので、cookie sessionを直接作る
      const session = await getSession(
        new Request('http://e2e.local', { headers: { Cookie: '' } }),
      )
      session.set('userId', account.id)
      const setCookieHeader = await commitSession(session)
      const cookiePair = setCookieHeader.split(';', 1)[0] ?? ''
      const eqIndex = cookiePair.indexOf('=')
      if (eqIndex < 0) throw new Error('Invalid Set-Cookie header')
      const cookieName = cookiePair.slice(0, eqIndex)
      const cookieValue = cookiePair.slice(eqIndex + 1)

      const cookieUrl = new URL(baseURL)
      cookieUrl.pathname = '/'
      await page.context().addCookies([
        {
          name: cookieName,
          value: cookieValue,
          url: cookieUrl.toString(),
        },
      ])

      await page.goto('/channels/@me')
      await page.waitForLoadState('networkidle')
      expect(page).toHaveURL('/channels/@me')

      await page.context().storageState({ path: fileName })
      await page.close()
      await use(fileName)
    },
    { scope: 'worker', timeout: 120_000 },
  ],
}

async function acquireUser(parallelId: number) {
  const name = `e2e-test-${parallelId}`

  return await db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({ where: { name } })

    if (user) return user

    const [newUser] = await tx
      .insert(users)
      .values([
        {
          name,
          email: `${name}@e2e.example.com`,
          password: hashPassword(AUTH_PASSWORD),
        },
      ])
      .returning()

    return newUser
  })
}
