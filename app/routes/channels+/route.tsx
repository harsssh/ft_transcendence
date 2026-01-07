import { ActionIcon, Avatar, Flex, Stack, Tooltip } from '@mantine/core'
import { IconMessageCircleFilled, IconCirclePlusFilled } from '@tabler/icons-react'
import { useState } from 'react'
import { NavLink, Outlet, useLoaderData } from 'react-router'
import { dbContext } from '../../contexts/db'
import { userContext } from '../../contexts/user'
import { authMiddleware } from '../../middlewares/auth'
import { Scaffold } from '../_shared/ui/Scaffold'
import type { Route } from './+types/route'
export { action } from './api/action.server'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export type ChannelsOutletContext = {
  setSecondaryNavbar: (node: React.ReactNode) => void
  setSecondaryNavbarWidth: (width: number) => void
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(dbContext)
  const user = context.get(userContext)

  const currentUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, user.id),
    with: {
      guilds: true,
    },
  })

  return {
    guilds: currentUser?.guilds ?? [],
  }
}

export default function Channels() {
  const { guilds } = useLoaderData<typeof loader>()
  const [secondaryNavbar, setSecondaryNavbar] =
    useState<React.ReactNode | null>(null)
  const [secondaryNavbarWidth, setSecondaryNavbarWidth] = useState<number>(0)

  return (
    <Scaffold
      navbar={<Navbar guilds={guilds}>{secondaryNavbar}</Navbar>}
      navbarWidth={72 + secondaryNavbarWidth}
    >
      <Outlet
        context={
          {
            setSecondaryNavbar,
            setSecondaryNavbarWidth,
          } satisfies ChannelsOutletContext
        }
      />
    </Scaffold>
  )
}

type NavbarProps = {
  children: React.ReactNode
  guilds: { id: number; name: string; icon: string | null }[]
}

function Navbar({ children, guilds }: NavbarProps) {
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
        className="border-r gap-4"
        style={{ borderRightColor: 'var(--app-shell-border-color)' }}
      >
        <Tooltip label="Direct Messages" position="right" withArrow>
          <NavLink to="/channels/@me">
            {({ isActive }) => (
              <Avatar
                radius="md"
                variant="filled"
                size={48}
                color={isActive ? 'indigo' : 'gray'}
                className="transition-all hover:rounded-xl cursor-pointer"
              >
                <IconMessageCircleFilled />
              </Avatar>
            )}
          </NavLink>
        </Tooltip>

        <div className="w-8 h-0.5 bg-gray-700/50 rounded-full" />

        {guilds.map((guild) => (
          <Tooltip key={guild.id} label={guild.name} position="right" withArrow>
            <NavLink to={`/channels/${guild.id}`}>
              {({ isActive }) => (
                <Avatar
                  src={guild.icon}
                  radius="lg"
                  variant="filled"
                  size={48}
                  color={isActive ? 'indigo' : 'gray'}
                  className="transition-all hover:rounded-xl cursor-pointer"
                >
                  {guild.name.substring(0, 2).toUpperCase()}
                </Avatar>
              )}
            </NavLink>
          </Tooltip>
        ))}

        <Tooltip label="Add a Server" position="right" withArrow>
          <ActionIcon
            variant="subtle"
            color="neutral"
            size={48}
            radius="md"
            className="transition-all hover:rounded-xl"
            // TODO: Open create server modal
            onClick={() => {}}
          >
            <IconCirclePlusFilled size={28} />
          </ActionIcon>
        </Tooltip>
      </Stack>
      {children}
    </Flex>
  )
}
