import { drizzle } from 'drizzle-orm/node-postgres'
import { createContext } from 'react-router'

const db = drizzle(process.env.DATABASE_URL ?? '')

export const dbContext = createContext(db)
