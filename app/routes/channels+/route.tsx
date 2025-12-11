import { Avatar, Flex, Stack } from '@mantine/core'
import { IconMessageCircleFilled } from '@tabler/icons-react'
import { authMiddleware } from 'app/middlewares/auth'
import { Link, Outlet, type UIMatch, useMatches } from 'react-router'
import { Scaffold } from '../_shared/ui/scaffold'
import type { ChannelsHandle } from './_shared/handle'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export default function Channels() {
  const matches = useMatches() as UIMatch<unknown, ChannelsHandle | undefined>[]
  const matchedNavbar = matches.find((m) => m.handle?.navbar)

  return (
    <Scaffold
      navbar={
        <Navbar>
          {matchedNavbar?.handle?.navbar(matchedNavbar.loaderData)}
        </Navbar>
      }
      navbarWidth={72 + (matchedNavbar?.handle?.navbarWidth ?? 0)}
    >
      <Outlet />
    </Scaffold>
  )
}

type NavbarProps = {
  children: React.ReactNode
}

function Navbar({ children }: NavbarProps) {
  return (
    <Flex justify="flex-start" align="flex-start" direction="row" wrap="nowrap">
      <Stack p="sm" align="center" justify="flex-start">
        <Link to="/channels/@me">
          <Avatar radius="md" size={48}>
            <IconMessageCircleFilled />
          </Avatar>
        </Link>
      </Stack>
      {children}
    </Flex>
  )
}
