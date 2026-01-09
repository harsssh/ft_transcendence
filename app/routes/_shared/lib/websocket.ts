import { ResultAsync } from 'neverthrow'

export function createWebSocket(uri: string) {
  return ResultAsync.fromPromise(fetch(`/api/health`), () => {}).map(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}${uri}`

    return new WebSocket(url)
  })
}
