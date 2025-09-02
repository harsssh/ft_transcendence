import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    // TODO: .snapshot の扱いを考える（.gitignoreする？CIでどう扱う？）
    // スナップショットは .snapshots 以下に保存する
    resolveSnapshotPath: (testPath, snapExtension) =>
      `.snapshots/${path.relative(import.meta.dirname, testPath)}${snapExtension}`,
    coverage: {
      enabled: true,
      reporter: ['json-summary', 'json', 'html'],
      reportOnFailure: true,
      reportsDirectory: '.coverage',
      // node_modules を除外するための設定
      // ref: https://github.com/vitest-dev/vitest/issues/7203
      excludeAfterRemap: true,
    },
  },
})
