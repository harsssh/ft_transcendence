import { expect } from '@playwright/test'
import { test } from '../fixtures'
import { takeScreenshot } from '../fixtures/screenshot'

test.describe('Sign up Page', () => {
  test.beforeEach(async ({ page }, info) => {
    await page.context().clearCookies()
    await page.goto('/signup')
    await page.waitForURL('/signup')
    await takeScreenshot(page, info, { name: 'signup-initial-page' })
  })

  test('should be able to sign up', async ({ page }) => {
    const name = `e2e-signup-user-${Date.now()}`
    const email = `${name}@e2e.example.com`

    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Create an account' }).click()

    await page.waitForURL('/channels/@me')
    expect(page).toHaveURL('/channels/@me')
  })

  test('should show error for existing email', async ({ page }) => {
    await page.getByLabel('Name').fill(`e2e-test-${Date.now()}`)
    await page.getByLabel('Email').fill('e2e-test-0@e2e.example.com')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Create an account' }).click()

    const errorMessage = page.getByText(
      'This username or email address is already taken.',
    )

    await expect(errorMessage).toHaveCount(2)
    await expect(errorMessage.nth(0)).toBeVisible()
    await expect(errorMessage.nth(1)).toBeVisible()

    expect(page).toHaveURL('/signup?index')
  })

  test('should show error for existing username', async ({ page }) => {
    await page.getByLabel('Name').fill('e2e-test-0')
    await page
      .getByLabel('Email')
      .fill(`e2e-signup-user-${Date.now()}@example.com`)
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Create an account' }).click()

    const errorMessage = page.getByText(
      'This username or email address is already taken.',
    )

    await expect(errorMessage).toHaveCount(2)
    await expect(errorMessage.nth(0)).toBeVisible()
    await expect(errorMessage.nth(1)).toBeVisible()

    expect(page).toHaveURL('/signup?index')
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Create an account' }).click()

    const nameError = page.getByText('Name is required.')
    const emailError = page.getByText('Email is required.')
    const passwordError = page.getByText('Password is required.')
    await expect(nameError).toBeVisible()
    await expect(emailError).toBeVisible()
    await expect(passwordError).toBeVisible()
    expect(page).toHaveURL('/signup')
  })

  test('should navigate to sign in page when link clicked', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Sign in' }).click()

    await page.waitForLoadState('domcontentloaded')
    expect(page).toHaveURL('/signin')
  })
})
