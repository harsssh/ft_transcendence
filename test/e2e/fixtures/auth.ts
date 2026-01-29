import fs from 'node:fs'
import path from 'node:path'
import { expect } from '@playwright/test'
import { db } from '../../../app/contexts/db'
import { hashPassword } from '../../../app/routes/_auth+/_shared/password.server'
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

      const page = await browser.newPage({
        storageState: { cookies: [], origins: [] },
        // fixtureではconfigで指定したbaseURLが使えないため明示的に指定
        // see: https://github.com/microsoft/playwright/issues/27558
        baseURL:
          process.env.E2E_BASE_URL ??
          // biome-ignore lint/complexity/useLiteralKeys: うるさい
          `https://${process.env['WEBAPP_HOST'] ?? process.env.HOST ?? 'localhost'}`,
        ignoreHTTPSErrors: true,
      })

      const account = await acquireUser(id)

      if (!account) throw new Error(`Failed to acquire user: ${id}`)

      await page.goto(`/signin`)
      await page.getByLabel('Email').fill(account.email)
      await page.getByLabel('Password').fill(AUTH_PASSWORD)
      await page.getByRole('button', { name: 'Sign in' }).click()

      // React Router v7のデータロードやハイドレーションを待つ. 'networkidle' はネットワーク通信がなくなるまで待機
      await page.waitForLoadState('networkidle')

      expect(page).toHaveURL('/channels/@me')

      await page.context().storageState({ path: fileName })
      await page.close()
      await use(fileName)
    },
    { scope: 'worker' },
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
