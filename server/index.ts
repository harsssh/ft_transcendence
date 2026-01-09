import { RouterContextProvider } from 'react-router'
import { createHonoServer } from 'react-router-hono-server/bun'
import { db, dbContext } from '../app/contexts/db'
import { initializeStorage } from '../app/contexts/storage'
import { channels } from './channels'
import { presence } from './presence'

// Run storage initialization
await initializeStorage()

const honoServer = await createHonoServer({
  defaultLogger: false,
  useWebSocket: true,
  configure(app, { upgradeWebSocket }) {
    app.get('/api/health', (c) => c.text('OK'))

    // WebSocket endpoint for real-time chat
    app.route('/api/channels', channels(upgradeWebSocket))
    app.route('/api/presence', presence(upgradeWebSocket))
  },
  getLoadContext() {
    const context = new RouterContextProvider()
    context.set(dbContext, db)
    return context
  },
})

export default honoServer
