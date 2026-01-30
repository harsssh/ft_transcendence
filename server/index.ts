import { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'
import { RouterContextProvider } from 'react-router'
import { createHonoServer } from 'react-router-hono-server/bun'
import { db, dbContext } from '../app/contexts/db'
import { initializeStorage } from '../app/contexts/storage'
import { channels } from './channels'
import { presence } from './users'
import { proxy } from './proxy'
// [3D Refine] Import recovery functionality
import { recover3DJobs } from '../3D/jobs/recovery'

// Run storage initialization
await initializeStorage()
// [3D Refine] Run 3D job recovery on startup
recover3DJobs().catch(e => console.error(e))

const createApp = (upgradeWebSocket: UpgradeWebSocket) =>
  new Hono()
    .get('/api/health', (c) => c.text('OK'))
    .route('/api/channels', channels(upgradeWebSocket))
    .route('/api/presence', presence(upgradeWebSocket))
    .route('/api/proxy', proxy)


const server = await createHonoServer({
  defaultLogger: false,
  useWebSocket: true,
  configure(app, { upgradeWebSocket }) {
    app.route('/', createApp(upgradeWebSocket))
  },
  getLoadContext() {
    const context = new RouterContextProvider()
    context.set(dbContext, db)
    return context
  },
})

export type AppType = ReturnType<typeof createApp>

export default server
