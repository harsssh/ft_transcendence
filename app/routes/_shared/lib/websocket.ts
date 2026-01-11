import { err, ok, ResultAsync } from 'neverthrow'

export function createWebSocket(uri: string) {
  return ResultAsync.fromPromise(fetch(`/api/health`), () => {}).andThen(
    (res) => {
      if (!res.ok) {
        return err(res.status)
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${protocol}//${window.location.host}${uri}`

      return ok(new WebSocket(url))
    },
  )
}
