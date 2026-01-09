import { createContext } from 'react'
import type { LoggedInUser } from './user.server'

export const LoggedInUserContext = createContext<LoggedInUser | null>(null)
