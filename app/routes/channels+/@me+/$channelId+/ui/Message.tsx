import { Box, Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'
import { useSyncExternalStore } from 'react'
import { UserAvatar } from './UserAvatar'

type Props = {
  createdAt: Date
  senderName: string
  content: string
  avatarSrc?: string | undefined | null
  withProfile?: boolean
}

export function Message({
  createdAt,
  senderName,
  content,
  avatarSrc = null,
  withProfile = false,
}: Props) {
  // サーバーとクライアントのロケールが異なる場合にhydration errorが発生するため、それを避けるハッチ
  const localeTimeCreatedAt = useSyncExternalStore(
    () => () => {},
    () => createdAt.toLocaleTimeString(),
    () => createdAt.toISOString(),
  )

  return (
    <Box
      pl={50}
      style={
        withProfile
          ? {
              position: 'relative',
              marginTop: 'var(--mantine-spacing-md)',
            }
          : {}
      }
    >
      {withProfile && (
        <Box style={{ position: 'absolute', left: '0px', top: '4px' }}>
          <UserAvatar name={senderName} src={avatarSrc} />
        </Box>
      )}
      <Box>
        {withProfile && (
          <Group align="center" gap="xs">
            <Text fw={700} c="white" size="sm">
              {senderName}
            </Text>
            <Text size="xs" c="dimmed">
              <TimeValue value={localeTimeCreatedAt} />
            </Text>
          </Group>
        )}
        <Text c="white" style={{ wordBreak: 'break-word' }}>
          {content}
        </Text>
      </Box>
    </Box>
  )
}
