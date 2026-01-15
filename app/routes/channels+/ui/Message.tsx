import { Box, Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'
import { useHover } from '@mantine/hooks'
import { useSyncExternalStore } from 'react'
import type { GuildOutletContext } from '../$guildId+/route'
import { type Role, UserAvatarPopover } from './UserAvatarPopover'

type Props = {
  createdAt: Date
  senderId: number
  senderName: string
  senderDisplayName: string | null
  content: string
  avatarSrc?: string | undefined | null
  withProfile?: boolean
  roles?: Role[] | undefined
  guild?: GuildOutletContext['guild'] | undefined
  loggedInUser?: GuildOutletContext['loggedInUser'] | undefined
}

export function Message({
  createdAt,
  senderId,
  senderName,
  senderDisplayName,
  content,
  avatarSrc = null,
  withProfile = false,
  roles,
  guild,
  loggedInUser,
}: Props) {
  // サーバーとクライアントのロケールが異なる場合にhydration errorが発生するため、それを避けるハッチ
  const localeTimeCreatedAt = useSyncExternalStore(
    () => () => {},
    () => createdAt.toLocaleTimeString(),
    () => createdAt.toISOString(),
  )
  const { ref: hoverRef, hovered } = useHover()

  return (
    <Box
      ref={hoverRef}
      pl={72}
      pos="relative"
      {...(hovered ? { bg: '#242428' } : {})}
      style={
        withProfile
          ? {
              marginTop: 'var(--mantine-spacing-md)',
            }
          : {}
      }
    >
      {withProfile && (
        <Box style={{ position: 'absolute', left: '16px', top: '2px' }}>
          <UserAvatarPopover
            id={senderId}
            name={senderName}
            displayName={senderDisplayName}
            src={avatarSrc}
            isEditable={loggedInUser?.name === senderName}
            roles={roles}
            guild={guild}
            loggedInUser={loggedInUser}
          />
        </Box>
      )}
      {!withProfile && hovered && (
        <Box style={{ position: 'absolute', left: '32px', top: '7px' }}>
          <Text size="11px" c="dimmed">
            <TimeValue value={localeTimeCreatedAt} />
          </Text>
        </Box>
      )}
      <Box>
        {withProfile && (
          <Group align="center" gap="xs">
            <Text fw={700} size="sm" maw="40rem" truncate="end">
              {senderDisplayName ?? senderName}
            </Text>
            <Text size="xs" c="dimmed">
              <TimeValue value={localeTimeCreatedAt} />
            </Text>
          </Group>
        )}
        <Group>
          <Text style={{ wordBreak: 'break-word' }}>{content}</Text>
        </Group>
      </Box>
    </Box>
  )
}
