import { Box, Button, Text } from '@mantine/core'
import { UserAvatar } from './UserAvatar'

type Props = {
  user:
    | {
        name?: string | null
        displayName?: string | null
      }
    | null
    | undefined
  opened: boolean
}

export function UserProfileSidebar({ user, opened }: Props) {
  if (!opened) return null

  return (
    <Box
      w={300}
      style={{
        borderLeft: '1px solid var(--ft-border-color)',
        flexShrink: 0,
        backgroundColor: 'var(--mantine-color-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        h={120}
        style={{
          backgroundColor: '#000000',
          position: 'relative',
        }}
      />

      <Box p="md" style={{ flex: 1, position: 'relative' }}>
        <Box
          mt={-50}
          mb="sm"
          style={{
            position: 'absolute',
            top: 0,
            left: 16,
          }}
        >
          <Box
            style={{
              border: '6px solid var(--mantine-color-body)',
              borderRadius: '50%',
              width: 'fit-content',
              backgroundColor: 'var(--mantine-color-body)',
            }}
          >
            <UserAvatar name={user?.name} size={80} />
          </Box>
        </Box>

        <Box mt={40}>
          <Text size="xl" fw={700} lh={1}>
            {user?.displayName || user?.name || 'Unknown'}
          </Text>
          <Text size="sm" c="dimmed">
            {user?.name || 'unknown'}
          </Text>
        </Box>

        <Box
          mt="md"
          h={1}
          style={{ backgroundColor: 'var(--ft-border-color)' }}
        />
      </Box>

      <Box p="md" mt="auto">
        <Button fullWidth variant="default">
          View Full Profile
        </Button>
      </Box>
    </Box>
  )
}
