import { Divider, Text } from '@mantine/core'

type Props = {
  date: string
}

export function DateSeparator({ date }: Props) {
  return (
    <Divider
      mt="lg"
      ml="md"
      mr="md"
      color="var(--transcendence-border-color)"
      label={
        <Text size="xs" c="dimmed" fw={600}>
          {date}
        </Text>
      }
      labelPosition="center"
      styles={{
        root: { marginBlock: '0.5rem' },
        label: { paddingInline: '0.75rem', padding: '0' },
      }}
    />
  )
}
