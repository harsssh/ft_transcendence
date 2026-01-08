import { createContext } from 'react-router'
import { createClient } from 'redis'

export const client = await createClient(
  process.env.PRESENCE_DB_URL ? { url: process.env.PRESENCE_DB_URL } : {},
).connect()

export const presenceContext = createContext(client)
