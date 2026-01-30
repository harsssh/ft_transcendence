import { ActionIcon, Box, Group, Menu, Text } from '@mantine/core'
import { IconLogout, IconSettings } from '@tabler/icons-react'
import { useContext } from 'react'
import { useSubmit } from 'react-router'
import { LoggedInUserContext } from '../../../contexts/user'
import { UserAvatarPopover } from '../_text/ui/UserAvatarPopover'

export function UserPanel() {
  const user = useContext(LoggedInUserContext)
  const submit = useSubmit()

  if (!user) return null

  return (
    <Box
      p={14}
      style={{
        position: 'sticky',
        bottom: 0,
        borderTop: '1px solid var(--ft-border-color)',
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" gap={4} wrap="nowrap">
        <Group
          justify="flex-start"
          gap={4}
          wrap="nowrap"
          style={{ flex: 1, minWidth: 0 }}
        >
          <UserAvatarPopover
            id={user.id}
            name={user.name}
            displayName={user.displayName}
            src={user.avatarUrl}
            isEditable={false}
          />
          <div className="ml-2 min-w-0">
            <Text size="sm" fw={700} c="white" truncate="end">
              {user.displayName ?? user.name}
            </Text>
            <Text size="xs" c="dimmed" truncate="end">
              {user.name}
            </Text>
          </div>
        </Group>

        <Menu shadow="md" width={210}>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              className="hover:bg-white/10"
            >
              <IconSettings
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                size={20}
              />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={14} />}
              onClick={() => {
                submit(null, { method: 'post', action: '/logout' })
              }}
            >
              Log Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  )
}
