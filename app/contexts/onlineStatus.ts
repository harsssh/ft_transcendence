import { createContext, useContext, useEffect, useState } from 'react'
import { LoggedInUserContext } from './user'

export type OnlineStatus = 'online' | 'offline'

export const OnlineStatusContext = createContext<OnlineStatus>('offline')

type Props = {
  id?: number | undefined
}

export function useOnlineStatus({ id }: Props) {
  const status = useContext(OnlineStatusContext)
  const loggedInUser = useContext(LoggedInUserContext)
  const [requiredStatus, setRequiredStatus] = useState<OnlineStatus>('offline')

  useEffect(() => {
    if (loggedInUser?.id === id) {
      setRequiredStatus(status)
      return
    }
  }, [status, loggedInUser, id])

  return requiredStatus
}
