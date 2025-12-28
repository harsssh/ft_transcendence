import { Box, Stack, Text } from '@mantine/core'
import { useId } from 'react'
import { UserAvatar } from './UserAvatar'

type Props = {
  profile: {
    name: string
    displayName: string | null
  }
  opened: boolean
}

export function UserProfileSidebar({ profile, opened }: Props) {
  const maskId = useId()
  if (!opened) return null

  return (
    <Stack w={340} h="100%" bg="oklab(0.262384 0.00252247 -0.00889932)" gap={8}>
      <Box mih={159} pos="relative">
        <svg
          viewBox="0 0 340 120"
          style={{ contain: 'paint', minHeight: '120px' }}
        >
          <title>Profile header</title>
          <mask id={maskId}>
            <rect fill="white" x="0" y="0" width="100%" height="100%" />
            <circle fill="black" cx="56" cy="112" r="46" />
          </mask>
          <foreignObject width="100%" height="100%" mask={`url(#${maskId})`}>
            <Box h={120} bg="black"></Box>
          </foreignObject>
        </svg>
        <Box top={72} left={16} pos="absolute">
          <UserAvatar name={profile.name} size={80} />
        </Box>
      </Box>
      <Stack mr="md" ml="md">
        <Box>
          <Text size="xl" fw={700} lh="24px">
            {profile.displayName ?? profile.name}
          </Text>
          <Text size="sm" lh="18px">
            {profile.name}
          </Text>
        </Box>
      </Stack>
    </Stack>
  )
}
