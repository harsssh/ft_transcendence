import { Avatar, Stack } from '@mantine/core'
import { IconMessageCircleFilled } from '@tabler/icons-react'
import { authMiddleware } from 'app/middlewares/auth'
import { Link, Outlet } from 'react-router'
import { Scaffold } from '../_shared/ui/scaffold'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export default function Channels() {
  return (
    <Scaffold navbar={<Navbar />}>
      <Outlet />
    </Scaffold>
  )
}

function Navbar() {
  return (
    <Stack p="sm" align="center" justify="flex-start">
      <Link to="/channels/@me">
        <Avatar radius="md" size={48}>
          <IconMessageCircleFilled />
        </Avatar>
      </Link>
    </Stack>
  )
}
