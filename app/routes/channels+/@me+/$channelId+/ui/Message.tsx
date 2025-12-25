import { Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'
import { useSyncExternalStore } from 'react'
import { UserAvatar } from './UserAvatar'

type Props = {
  createdAt: Date
  senderName: string
  content: string
  avatarSrc?: string | undefined | null
  withAvatar?: boolean
}

export function Message({
  createdAt,
  senderName,
  content,
  avatarSrc = null,
  withAvatar = false,
}: Props) {
  // サーバーとクライアントのロケールが異なる場合にhydration errorが発生するため、それを避けるハッチ
  const localeTimeCreatedAt = useSyncExternalStore(
    () => () => {},
    () => createdAt.toLocaleTimeString(),
    () => createdAt.toISOString(),
  )

  return (
    <Group align="center" justify="flex-start" gap={4}>
      {withAvatar && <UserAvatar name={senderName} src={avatarSrc} />}
      <Text size="11px" c="dimmed">
        <TimeValue value={localeTimeCreatedAt} />
      </Text>
      <Text fw={700} c="white">
        {senderName}
      </Text>
      <Text c="white" style={{ wordBreak: 'break-word' }}>
        {content}
      </Text>
    </Group>
  )
}
