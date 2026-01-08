import { Avatar, Flex, Stack } from '@mantine/core'
import { IconMessageCircleFilled } from '@tabler/icons-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { authMiddleware } from '../../middlewares/auth'
import { Scaffold } from '../_shared/ui/Scaffold'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export { loader } from './api/loader.server'

export type ChannelsOutletContext = {
  setSecondaryNavbar: (node: React.ReactNode) => void
}

export default function Channels() {
  const [secondaryNavbar, setSecondaryNavbar] =
    useState<React.ReactNode | null>(null)

  return (
    <Scaffold navbar={<Navbar>{secondaryNavbar}</Navbar>} navbarWidth={372}>
      <Outlet
        context={
          {
            setSecondaryNavbar,
          } satisfies ChannelsOutletContext
        }
      />
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
