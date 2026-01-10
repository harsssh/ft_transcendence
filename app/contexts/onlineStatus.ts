import { useInterval } from '@mantine/hooks'
import { hc } from 'hono/client'
import { err, ResultAsync } from 'neverthrow'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { AppType } from '../../server'
import { LoggedInUserContext } from './user'

export type OnlineStatus = 'online' | 'offline'

export const OnlineStatusContext = createContext<OnlineStatus>('offline')

type Props = {
  id?: number | undefined
}

const ONLINE_STATUS_UPDATE_INTERVAL_MS = 5000

// TODO: ポーリングが最適かどうか考え直す
export function useOnlineStatus({ id }: Props) {
  const status = useContext(OnlineStatusContext)
  const loggedInUser = useContext(LoggedInUserContext)
  const [requiredStatus, setRequiredStatus] = useState<OnlineStatus>('offline')
  const fetchUserOnlineStatus = useCallback(async () => {
    if (!id) return 'offline'

    if (loggedInUser?.id === id) {
      return status
    }

    return ResultAsync.fromPromise(
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
        (userStatus) => userStatus,
        (e) => {
          console.log('Failed to fetch online status:', e)
          return 'offline' as const
        },
      )
  }, [id, loggedInUser, status])

  const updateRequiredStatusInterval = useInterval(() => {
    fetchUserOnlineStatus().then((userStatus) => {
      setRequiredStatus(userStatus)
    })
  }, ONLINE_STATUS_UPDATE_INTERVAL_MS)

  useEffect(() => {
    fetchUserOnlineStatus().then((userStatus) => {
      setRequiredStatus(userStatus)
    })
    updateRequiredStatusInterval.start()

    return updateRequiredStatusInterval.stop
  }, [fetchUserOnlineStatus, updateRequiredStatusInterval])

  return requiredStatus
}
