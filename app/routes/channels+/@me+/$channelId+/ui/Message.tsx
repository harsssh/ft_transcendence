import { Box, Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'
import { useSyncExternalStore } from 'react'
import { UserAvatar } from './UserAvatar'
import { useFocusWithin, useHover } from '@mantine/hooks'

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
          <UserAvatar name={senderName} src={avatarSrc} />
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
            <Text fw={700} c="white" size="sm">
              {senderName}
            </Text>
            <Text size="xs" c="dimmed">
              <TimeValue value={localeTimeCreatedAt} />
            </Text>
          </Group>
        )}
        <Group>
          <Text c="white" style={{ wordBreak: 'break-word' }}>
            {content}
          </Text>
        </Group>
      </Box>
    </Box>
  )
}
