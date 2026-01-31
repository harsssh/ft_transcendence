import { expect } from '@playwright/test'
import { test } from '../fixtures'

test.describe('Channels navbar interactions (desktop)', () => {
  test('navbar is visible by default', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('Mobile'), 'desktop only')

    await page.goto('/channels/@me')

    const navbar = page.getByTestId('app-navbar')
    await expect(navbar).toBeVisible()

    // desktopでは戻る(←)ボタンは出さない想定
    await expect(page.getByRole('button', { name: 'Open navbar' })).toHaveCount(
      0,
    )
  })
})
