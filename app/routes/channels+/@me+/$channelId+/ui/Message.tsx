import { Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'

type Props = {
  createdAt: Date
  senderName: string
  content: string
}

export function Message({ createdAt, senderName, content }: Props) {
  return (
    <Group align="center" justify="flex-start" gap={4}>
      <Text size="11px" c="dimmed">
        <TimeValue value={createdAt} />
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
