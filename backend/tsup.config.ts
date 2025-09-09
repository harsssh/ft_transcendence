import { defineConfig } from 'tsup'

export default defineConfig(() => ({
  entry: ['src/**/*.ts', "!src/**/*.test.ts"],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  noExternal: ['@workspace/generated'],
  bundle: false,
  sourcemap: true,
  dts: false,
  splitting: false,
  clean: true,
  minify: false,
  shims: false,
}))
