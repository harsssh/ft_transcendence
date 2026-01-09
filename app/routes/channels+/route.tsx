import { Avatar, Flex, Stack } from '@mantine/core'
import { IconMessageCircleFilled } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import {
  type OnlineStatus,
  OnlineStatusContext,
} from '../../contexts/onlineStatus'
import { LoggedInUserContext } from '../../contexts/user'
import { loggedInUserContext } from '../../contexts/user.server'
import { authMiddleware } from '../../middlewares/auth'
import { createWebSocket } from '../_shared/lib/websocket'
import { Scaffold } from '../_shared/ui/Scaffold'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export const loader = ({ context }: Route.LoaderArgs) => {
  const user = context.get(loggedInUserContext)
  return { user }
}

export type ChannelsOutletContext = {
  setSecondaryNavbar: (node: React.ReactNode) => void
}

export default function Channels({ loaderData }: Route.ComponentProps) {
  const [secondaryNavbar, setSecondaryNavbar] =
    useState<React.ReactNode | null>(null)
  const [status, setStatus] = useState<OnlineStatus>('offline')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    createWebSocket(`/api/presence/ws`).match(
      (ws) => {
        wsRef.current = ws

        ws.onopen = () => {
          setStatus('online')
        }

        ws.onerror = (err) => {
          console.log('Presence websocket error:', err)
        }

        ws.onclose = () => {
          setStatus('offline')
        }
      },
      () => {},
    )

    return () => {
      const state = wsRef.current?.readyState
      if (state === WebSocket.OPEN) {
        wsRef.current?.close()
      }
      setStatus('offline')
      wsRef.current = null
    }
  }, [])

  return (
    <LoggedInUserContext.Provider value={loaderData.user}>
      <OnlineStatusContext.Provider value={status}>
        <Scaffold navbar={<Navbar>{secondaryNavbar}</Navbar>} navbarWidth={372}>
          <Outlet
            context={
              {
                setSecondaryNavbar,
              } satisfies ChannelsOutletContext
            }
          />
        </Scaffold>
      </OnlineStatusContext.Provider>
    </LoggedInUserContext.Provider>
  )
}

type NavbarProps = {
  children: React.ReactNode
}

function Navbar({ children }: NavbarProps) {
  return (
    <Flex
      justify="flex-start"
      align="flex-start"
      direction="row"
      wrap="nowrap"
      h="100%"
    >
      <Stack p="sm" align="center" justify="flex-start" h="100%">
        <NavLink to="/channels/@me">
          {({ isActive }) => (
            <Avatar
              radius="md"
              variant="filled"
              size={48}
              color={isActive ? 'indigo' : 'gray'}
            >
              <IconMessageCircleFilled />
            </Avatar>
          )}
        </NavLink>
      </Stack>
      {children}
    </Flex>
  )
}
