import { test as baseTest } from '@playwright/test'
import {
  type AuthTestTestFixtures,
  type AuthTestWorkerFixtures,
  authTestFixtures,
} from './auth'
import {
  screenshotTestFixtures,
  type ScreenshotTestTestFixtures,
} from './screenshot'

export const test = baseTest.extend<
  ScreenshotTestTestFixtures & AuthTestTestFixtures,
  AuthTestWorkerFixtures
>({
  ...authTestFixtures,
  ...screenshotTestFixtures,
})
