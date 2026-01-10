import { createContext as createReactRouterContext } from 'react-router'
import { createClient } from 'redis'

export const presenceClient = await createClient(
  process.env.PRESENCE_DB_URL ? { url: process.env.PRESENCE_DB_URL } : {},
).connect()

export const presenceClientContext = createReactRouterContext(presenceClient)
