import { defineConfig } from 'tsup'

export default defineConfig(() => ({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  noExternal: ['@workspace/generated'],
  sourcemap: true,
  dts: false,
  splitting: false,
  clean: true,
  minify: false,
  shims: false,
}))
