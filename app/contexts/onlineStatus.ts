import { createContext, useContext, useEffect, useState } from 'react'
import { LoggedInUserContext } from './user'
import { err, ResultAsync } from 'neverthrow'
import { hc } from 'hono/client'
import type { AppType } from '../../server'
import { useInterval } from '@mantine/hooks'

export type OnlineStatus = 'online' | 'offline'

export const OnlineStatusContext = createContext<OnlineStatus>('offline')

type Props = {
  id?: number | undefined
}

const ONLINE_STATUS_UPDATE_INTERVAL_MS = 5000

export function useOnlineStatus({ id }: Props) {
  const status = useContext(OnlineStatusContext)
  const loggedInUser = useContext(LoggedInUserContext)
  const [requiredStatus, setRequiredStatus] = useState<OnlineStatus>('offline')
  const updateRequiredStatusInterval = useInterval(() => {
    ResultAsync.fromPromise(
      hc<AppType>('/').api.presence[':userId'].$get({
        param: { userId: id?.toString() ?? '' },
      }),
      (e) => e,
    )
      .andThen((res) => {
        if (!res.ok) {
          return err(res.statusText)
        }

        return ResultAsync.fromPromise(res.json(), (e) => e).map(
          ({ status }) => status as OnlineStatus,
        )
      })
      .match(
        (userStatus) => {
          setRequiredStatus(userStatus)
        },
        () => {
          setRequiredStatus('offline')
        },
      )
  }, ONLINE_STATUS_UPDATE_INTERVAL_MS)

  useEffect(() => {
    if (!id) return

    if (loggedInUser?.id === id) {
      setRequiredStatus(status)
      return
    }

    updateRequiredStatusInterval.start()

    return () => {
      updateRequiredStatusInterval.stop()
    }
  }, [status, loggedInUser, id, updateRequiredStatusInterval])

  return requiredStatus
}
