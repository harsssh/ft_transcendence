import { createContext } from 'react-router'

type LoggedInUser = {
  id: number
  name: string
}

export const userContext = createContext<LoggedInUser | null>(null)
