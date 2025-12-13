import { parseWithZod } from '@conform-to/zod/v4'
import { Avatar, Flex, Stack } from '@mantine/core'
import { IconMessageCircleFilled } from '@tabler/icons-react'
import {
  NavLink,
  Outlet,
  redirect,
  type UIMatch,
  useMatches,
} from 'react-router'
import { channels } from '../../../db/schema'
import { dbContext } from '../../contexts/db'
import { userContext } from '../../contexts/user'
import { authMiddleware } from '../../middlewares/auth'
import { Scaffold } from '../_shared/ui/Scaffold'
import { NewChannelFormSchema } from './@me+/model/newChannelForm'
import type { ChannelsHandle } from './_shared/handle'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export const action = async ({ context, request }: Route.ActionArgs) => {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: NewChannelFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const db = context.get(dbContext)
  const [channel] = await db
    .insert(channels)
    .values({ name: submission.value.name })
    .returning()

  throw redirect(`/channels/@me/${channel?.id}`)
}

export default function Channels({ actionData }: Route.ComponentProps) {
  const matches = useMatches() as UIMatch<unknown, ChannelsHandle | undefined>[]
  const matchedNavbar = matches.find((m) => m.handle?.navbar)

  return (
    <Scaffold
      navbar={
        <Navbar>
          {matchedNavbar?.handle?.navbar(matchedNavbar.loaderData, actionData)}
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
    <Flex
      justify="flex-start"
      align="flex-start"
      direction="row"
      wrap="nowrap"
      h="100%"
    >
      <Stack
        p="sm"
        align="center"
        justify="flex-start"
        h="100%"
        className="border-r"
        style={{ borderRightColor: 'var(--app-shell-border-color)' }}
      >
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
