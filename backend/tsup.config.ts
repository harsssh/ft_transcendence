import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  noExternal: ['@workspace/generated'],
  sourcemap: !options.minify,
  dts: false,
  splitting: false,
  clean: true,
  minify: false,
  shims: false,
}))
