/// <reference types="vitest" />

import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    // TODO: .snapshot の扱いを考える（.gitignoreする？CIでどう扱う？）
    // スナップショットは .snapshots 以下に保存する
    resolveSnapshotPath: (testPath, snapExtension) =>
      `.snapshots/${path.relative(import.meta.dirname, testPath)}${snapExtension}`,
    coverage: {
      enabled: true,
      reporter: ['json-summary', 'html'],
      reportOnFailure: true,
      reportsDirectory: '../.coverage/frontend',
    },
  },
})
