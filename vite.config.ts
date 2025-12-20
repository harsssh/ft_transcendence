import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { reactRouterHonoServer } from 'react-router-hono-server/dev'

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    reactRouterHonoServer({
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
