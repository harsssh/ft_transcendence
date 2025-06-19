import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'Reaft.createElement',
    jsxFragment: 'Reaft.Fragment',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development')
  },
  server: {
    port: 5173,
    host: true
  }
})