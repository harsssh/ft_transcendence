import { createContext } from 'react-router'

export type LoggedInUser = {
  id: number
  name: string
  displayName: string | null
  avatarUrl: string | null
}

export const loggedInUserContext = createContext<LoggedInUser | null>(null)
