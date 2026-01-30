import { expect, type Locator } from '@playwright/test'
import { test } from '../fixtures'
import { db } from '../../../app/contexts/db'
import { channels, users, usersToChannels } from '../../../db/schema'

async function expectNavbarCollapsed(navbar: Locator) {
  if (await navbar.isHidden()) return

  const right = await navbar.evaluate((el) => el.getBoundingClientRect().right)
  expect(right).toBeLessThanOrEqual(1)
}

async function ensureDmChannel(parallelIndex: number) {
  const meName = `e2e-test-${parallelIndex}`
  const partnerName = `e2e-partner-${parallelIndex}`

  return await db.transaction(async (tx) => {
    const me = await tx.query.users.findFirst({ where: { name: meName } })
    if (!me) throw new Error(`Missing user: ${meName}`)

    const partner =
      (await tx.query.users.findFirst({ where: { name: partnerName } })) ??
      (await tx
        .insert(users)
        .values({
          name: partnerName,
          email: `${partnerName}@e2e.example.com`,
          password: me.password,
        })
        .returning()
        .then((rows) => rows[0]))

    if (!partner) throw new Error('Failed to create partner user')

    const existing = await tx.query.usersToChannels.findFirst({
      where: { userId: me.id },
    })

    if (existing?.channelId) {
      return { channelId: existing.channelId, partnerName }
    }

    const [newChannel] = await tx.insert(channels).values({}).returning()
    if (!newChannel) throw new Error('Failed to create channel')

    await tx.insert(usersToChannels).values([
      { userId: me.id, channelId: newChannel.id },
      { userId: partner.id, channelId: newChannel.id },
    ])

    return { channelId: newChannel.id, partnerName }
  })
}

test.describe('Channels navbar interactions (mobile)', () => {
  test('back button opens navbar; swipe left closes; navbar is full width', async ({
    page,
  }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('Mobile'), 'mobile only')

    await page.goto('/channels/@me')

    const navbar = page.getByTestId('app-navbar')
    await expectNavbarCollapsed(navbar)

    await page.getByRole('button', { name: 'Open navbar' }).click()
    await expect(navbar).toBeVisible()

    // 全幅
    const rect = await navbar.evaluate((el) => el.getBoundingClientRect())
    const vp = page.viewportSize()
    expect(vp).not.toBeNull()
    if (vp) {
      expect(Math.abs(rect.width - vp.width)).toBeLessThanOrEqual(2)
    }

    // 左スワイプで閉じる（ドラッグ操作で再現）
    const navRect = await navbar.evaluate((el) => el.getBoundingClientRect())
    const y = navRect.top + Math.min(80, Math.max(40, navRect.height * 0.15))
    const startX = navRect.left + navRect.width - 20
    const endX = navRect.left + 10

    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(endX, y)
    await page.mouse.up()

    await expectNavbarCollapsed(navbar)
  })

  test('DM header has back button and opens navbar', async ({
    page,
  }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('Mobile'), 'mobile only')

    const { channelId } = await ensureDmChannel(testInfo.parallelIndex)

    await page.goto(`/channels/@me/${channelId}`)

    const navbar = page.getByTestId('app-navbar')
    await expectNavbarCollapsed(navbar)

    await page.getByRole('button', { name: 'Open navbar' }).click()
    await expect(navbar).toBeVisible()
  })
})
