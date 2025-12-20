import { RouterContextProvider } from 'react-router'
import { createHonoServer } from 'react-router-hono-server/node'
import { drizzle } from 'drizzle-orm/node-postgres'
import { relations } from '../db/schema'
import { dbContext } from '../app/contexts/db'

export default await createHonoServer({
  defaultLogger: false,
  configure(server) {
    server.get('/api', (c) => c.text('hello'))
  },
  getLoadContext() {
    const context = new RouterContextProvider()
    const db = drizzle(process.env.DATABASE_URL, { relations })
    context.set(dbContext, db)
    return context
  },
})
