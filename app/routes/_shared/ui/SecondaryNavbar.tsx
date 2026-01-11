import { Stack } from '@mantine/core'

const SECONDARY_NAVBAR_WIDTH = 300

export function SecondaryNavbar({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      gap="sm"
      w={SECONDARY_NAVBAR_WIDTH}
      h="100%"
      style={{
        borderInlineStart: '1px solid var(--ft-border-color)',
        borderStartStartRadius: '12px',
        borderTop: '1px solid var(--ft-border-color)',
      }}
    >
      {children}
    </Stack>
  )
}
