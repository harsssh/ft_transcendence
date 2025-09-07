import { defineConfig } from 'tsup'

export default defineConfig(() => ({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  noExternal: ['@workspace/generated'],
  sourcemap: false,
  dts: false,
  splitting: false,
  clean: true,
  minify: true,
  shims: false,
}))
