import { createContext } from 'react-router'

export type LoggedInUser = {
  id: number
  name: string
}

export const userContext = createContext<LoggedInUser | null>(null)
