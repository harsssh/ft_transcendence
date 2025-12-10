import { createContext } from 'react-router'
import { drizzle } from 'drizzle-orm/node-postgres'

const db = drizzle(process.env.DATABASE_URL ?? '')

export const dbContext = createContext(db)
