import { expect } from '@playwright/test'
import { test } from '../fixtures'

test.describe('Index Page', () => {
  test('should redirect to /channels/@me when logged in', async ({ page }) => {
    await page.goto('/')

    await page.waitForURL('/channels/@me')

    expect(page).toHaveURL('/channels/@me')
  })

  test('should show signin page when not logged in', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/')

    await page.waitForURL('/signin')

    expect(page).toHaveURL('/signin')
  })
})
