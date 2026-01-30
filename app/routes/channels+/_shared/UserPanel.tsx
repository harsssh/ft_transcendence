import { ActionIcon, Group, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useContext } from 'react'
import { LoggedInUserContext } from '../../../contexts/user'
import { UserAvatar } from '../_text/ui/UserAvatar'

export function UserPanel() {
  const user = useContext(LoggedInUserContext)

  if (!user) return null

  return (
    <div className="bg-gray w-full p-5 flex-shrink-0 border-t border-white/5">
      <Group justify="space-between" gap={4} wrap="nowrap">
        <UnstyledButton className="flex items-center flex-1 py-1 px-1.5 rounded-md transition-colors duration-200">
          <UserAvatar
            id={user.id}
            name={user.name}
            src={user.avatarUrl}
            withOnlineStatus
          />
          <div className="ml-2">
            <Text size="sm" fw={700} c="white" style={{ lineHeight: 1.2 }}>
              {user.name}
            </Text>
            <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
              {'online'}
            </Text>
          </div>
        </UnstyledButton>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          className="hover:bg-white/10"
        >
          <IconSettings
            className="text-zinc-500 hover:text-zinc-200 transion-colors"
            size={20}
          />
        </ActionIcon>
      </Group>
    </div>
  )
}
