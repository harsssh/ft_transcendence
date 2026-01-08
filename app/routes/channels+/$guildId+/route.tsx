import {
  Button,
  Flex,
  NavLink as MantineNavLink,
  Menu,
  Text,
} from '@mantine/core'
import {
  IconChevronDown,
  IconCookieMan,
  IconHash,
  IconLogout,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { useEffect } from 'react'
import { NavLink, useLoaderData, useOutletContext } from 'react-router'
import { authMiddleware } from '../../../middlewares/auth'
import type { ChannelsOutletContext } from '../route'
import type { Route } from './+types/route'
import { loader } from './api/loader.server'

export { loader }

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export default function GuildRoute() {
  const { guild } = useLoaderData<typeof loader>()
  const { setSecondaryNavbar, setSecondaryNavbarWidth } =
    useOutletContext<ChannelsOutletContext>()

  useEffect(() => {
    setSecondaryNavbarWidth(240)
    setSecondaryNavbar(
      <Flex direction="column" h="100%" w={240}>
        <Flex
          h={48}
          align="center"
          px="md"
          className="border-b font-bold truncate"
          style={{ borderColor: 'var(--app-shell-border-color)' }}
        >
          <Menu position="bottom-start" shadow="md" width={210}>
            <Menu.Target>
              <Button
                variant="light"
                color="neutral"
                radius="md"
                className="rounded-md"
              >
                <Text truncate="end">{guild.name}</Text>
                <IconChevronDown size={14} style={{ flexShrink: 0 }} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item rightSection={<IconCookieMan size={18} />}>
                Invite to Server
              </Menu.Item>
              <Menu.Item rightSection={<IconPencil size={18} />}>
                Rename Server
              </Menu.Item>
              <Menu.Item rightSection={<IconPlus size={18} />}>
                Create Channel
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" rightSection={<IconLogout size={18} />}>
                Leave Server
              </Menu.Item>
              <Menu.Item color="red" rightSection={<IconTrash size={18} />}>
                Delete Server
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>
        <Flex
          direction="column"
          p="xs"
          gap={2}
          className="flex-1 overflow-y-auto"
        >
          {guild.channels.map((channel) => (
            <MantineNavLink
              key={channel.id}
              component={NavLink}
              to={`/channels/${guild.id}/${channel.id}`}
              label={channel.name}
              leftSection={<IconHash size={20} stroke={2} />}
              variant="light"
              className="rounded-md"
            />
          ))}
        </Flex>
      </Flex>,
    )

    return () => {
      setSecondaryNavbar(null)
      setSecondaryNavbarWidth(0)
    }
  }, [guild, setSecondaryNavbar, setSecondaryNavbarWidth])

  return (
    <Flex h="100%" align="center" justify="center" direction="column">
      <Text c="dimmed">Select a channel</Text>
    </Flex>
  )
}
