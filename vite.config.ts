import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { reactRouterHonoServer } from 'react-router-hono-server/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    reactRouterHonoServer({
      runtime: 'bun',
      serverEntryPoint: 'server/index.ts',
    }),
  ],
  ...(config.command === 'build'
    ? {
        resolve: {
          alias: {
            'react-dom/server': 'react-dom/server.node',
          },
        },
      }
    : {}),
}))
