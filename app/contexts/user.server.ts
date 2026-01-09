import { createContext } from 'react-router'

export type LoggedInUser = {
  id: number
  name: string
}

export const loggedInUserContext = createContext<LoggedInUser | null>(null)
