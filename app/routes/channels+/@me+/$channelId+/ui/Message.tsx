import { Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'
import { useSyncExternalStore } from 'react'

type Props = {
  createdAt: Date
  senderName: string
  content: string
}

export function Message(props: Props) {
  // サーバーとクライアントのロケールが異なる場合にhydration errorが発生するため、それを避けるハッチ
  const createdAt = useSyncExternalStore(
    () => () => {},
    () => props.createdAt.toLocaleTimeString(),
    () => props.createdAt.toISOString(),
  )

  return (
    <Group align="center" justify="flex-start" gap={4}>
      <Text size="11px" c="dimmed">
        <TimeValue value={createdAt} />
      </Text>
      <Text fw={700} c="white">
        {props.senderName}
      </Text>
      <Text c="white" style={{ wordBreak: 'break-word' }}>
        {props.content}
      </Text>
    </Group>
  )
}
