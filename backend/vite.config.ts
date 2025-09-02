import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      reporter: ['json-summary', 'json', 'html'],
      reportOnFailure: true,
      reportsDirectory: '../.coverage/backend',
    },
  },
})
