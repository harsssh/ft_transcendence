import { expect } from '@playwright/test'
import { test } from '../fixtures'

test.describe('Index Page', () => {
  test('should display signup form', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    expect(page).toHaveURL('/channels/@me')
  })
})
