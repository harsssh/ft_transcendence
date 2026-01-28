import type { Page, TestInfo } from '@playwright/test'
import type { FixturesExtension } from './types'
import { test } from '.'

export type ScreenshotTestTestFixtures = {
  screenshotOnAfterEach: undefined
}

export const screenshotTestFixtures: FixturesExtension<{
  test: ScreenshotTestTestFixtures
}> = {
  screenshotOnAfterEach: [
    async ({ page }, use) => {
      await use(undefined)
      await takeScreenshot(page, test.info())
    },
    { scope: 'test', auto: true },
  ],
}

export const takeScreenshot = async (
  page: Page,
  info: TestInfo,
  option?: { name?: string },
) => {
  await page.waitForLoadState('networkidle')

  const screenshot = await page.screenshot({
    animations: 'disabled', // CSSアニメーションを止めてブレを防ぐ
  })

  await info.attach(`Screenshot${option?.name ? ` - ${option.name} ` : ''}`, {
    body: screenshot,
    contentType: 'image/png',
  })
}
