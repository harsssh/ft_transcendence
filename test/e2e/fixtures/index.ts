import { test as baseTest } from '@playwright/test'
import { type AuthTestWorkerFixtures, authTestFixtures } from './auth'
import {
  type ScreenshotTestTestFixtures,
  screenshotTestFixtures,
} from './screenshot'

export const test = baseTest.extend<
  ScreenshotTestTestFixtures,
  AuthTestWorkerFixtures
>({
  ...authTestFixtures,
  ...screenshotTestFixtures,
})
