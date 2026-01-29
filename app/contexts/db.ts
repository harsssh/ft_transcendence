import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { createContext } from 'react-router'
import { relations } from '../../db/schema'

export const db = drizzle(process.env.DATABASE_URL, { relations })

export const dbContext = createContext(db)
