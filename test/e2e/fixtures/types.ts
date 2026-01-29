/** biome-ignore-all lint/complexity/noBannedTypes: playwrightの型に合わせるため */
import type {
  Fixtures as PlaywrightFixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'

export type FixturesExtension<
  Fixtures extends Partial<{ test: T; worker: W }> = {},
  T extends {} = {},
  W extends {} = {},
> = PlaywrightFixtures<
  Fixtures['test'] & T,
  Fixtures['worker'] & W,
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>
