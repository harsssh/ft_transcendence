import { createContext, type ReactNode, useContext } from 'react'

type OnlineStatusContextType = {
  isUserOnline: (userId: number) => boolean
}

const OnlineStatusContext = createContext<OnlineStatusContextType | null>(null)

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const onlineStatus = useOnlineStatus()

  return (
    <OnlineStatusContext.Provider value={onlineStatus}>
      {children}
    </OnlineStatusContext.Provider>
  )
}

export function useOnlineStatusContext() {
  const context = useContext(OnlineStatusContext)
  if (!context) {
    throw new Error(
      'useOnlineStatusContext must be used within an OnlineStatusProvider',
    )
  }
  return context
}

import { useCallback, useEffect, useRef, useState } from 'react'

type OnlineStatusState = {
  onlineUserIds: Set<number>
  status: 'connecting' | 'open' | 'closed'
}

/**
 * Hook to subscribe to online user status via WebSocket
 * Returns a set of online user IDs and a helper function to check if a user is online
 */
function useOnlineStatus() {
  const [state, setState] = useState<OnlineStatusState>({
    onlineUserIds: new Set(),
    status: 'connecting',
  })
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/presence`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Presence WebSocket connected')
      setState((prev) => ({ ...prev, status: 'open' }))
      reconnectAttempts.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'online-users') {
          setState((prev) => ({
            ...prev,
            onlineUserIds: new Set(data.data as number[]),
          }))
        }
      } catch (error) {
        console.error('Failed to parse presence message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Presence WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Presence WebSocket disconnected')
      setState((prev) => ({ ...prev, status: 'closed' }))
      wsRef.current = null

      // Reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
        reconnectAttempts.current++
        console.log(`Reconnecting presence in ${delay}ms...`)
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const isUserOnline = useCallback(
    (userId: number) => {
      return state.onlineUserIds.has(userId)
    },
    [state.onlineUserIds],
  )

  return {
    isUserOnline,
  }
}
