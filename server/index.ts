import { RouterContextProvider } from 'react-router'
import { createHonoServer } from 'react-router-hono-server/bun'
import { db, dbContext } from '../app/contexts/db'
import { initializeStorage } from '../app/contexts/storage'
import { channels } from './channels'

// Run storage initialization
await initializeStorage()

const honoServer = await createHonoServer({
  defaultLogger: false,
  useWebSocket: true,
  configure(app, { upgradeWebSocket }) {
    app.get('/api', (c) => c.text('hello'))

    // WebSocket endpoint for real-time chat
    app.route('/ws/channels/', channels(upgradeWebSocket))
  },
  getLoadContext() {
    const context = new RouterContextProvider()
    context.set(dbContext, db)
    return context
  },
})

export default honoServer
