import {
  type PlaywrightTestArgs,
  type PlaywrightWorkerArgs,
  type TestInfo,
  test,
} from '@playwright/test'

const viewports = [
  {
    name: 'desktop',
    width: 1280,
    height: 720,
    isMobile: false,
  },
  {
    name: 'mobile-portrait',
    width: 375,
    height: 667,
    isMobile: true,
  },
  {
    name: 'mobile-landscape',
    width: 667,
    height: 375,
    isMobile: true,
  },
]

const takeScreenshot = (
  path: string,
  opts?: {
    beforeEach?: (
      args: PlaywrightTestArgs & PlaywrightWorkerArgs,
      testInfo: TestInfo,
    ) => Promise<unknown> | unknown
  },
) => {
  test.describe(`Screenshot at ${path}`, () => {
    viewports.forEach((vp) => {
      if (opts?.beforeEach) {
        test.beforeEach(opts.beforeEach)
      }

      test(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })

        const baseURL =
          process.env.E2E_BASE_URL ??
          `https://${
            // biome-ignore lint/complexity/useLiteralKeys: https://github.com/biomejs/biome/issues/463
            process.env['WEBAPP_HOST'] ?? process.env.HOST ?? 'localhost'
          }`
        const targetURL = `${baseURL}${path}`

        await page.goto(targetURL)

        // React Router v7のデータロードやハイドレーションを待つ. 'networkidle' はネットワーク通信がなくなるまで待機
        await page.waitForLoadState('networkidle')

        const safePath =
          path === '/' ? 'home' : path.replace(/\//g, '-').replace(/^-/, '')
        const fileName = `${safePath}--${vp.name}.png`

        const screenshot = await page.screenshot({
          fullPage: true,
          animations: 'disabled', // CSSアニメーションを止めてブレを防ぐ
        })

        await info.attach(fileName, {
          body: screenshot,
          contentType: 'image/png',
        })
      })
    })
  })
}

test.describe('E2E Screenshots', () => {
  takeScreenshot('/signup')
  takeScreenshot('/login')
})
