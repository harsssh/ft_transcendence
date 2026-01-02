import { Box, Popover, Stack, Text, UnstyledButton } from '@mantine/core'
import { useId } from 'react'
import { UserAvatar, type UserAvatarProps } from './UserAvatar'

type Props = UserAvatarProps & {
  displayName?: string | null
}

export function UserAvatarPopover(props: Props) {
  const maskId = useId()

  return (
    <Popover position="right-start">
      <Popover.Target>
        <UnstyledButton className="active:transform-[translateY(1px)]">
          <UserAvatar {...props} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown
        p={0}
        bd="none"
        bdrs="8px"
        style={{
          boxShadow:
            '0 0 0 1px hsl(none 0% 100%/0.08), 0 12px 24px 0 hsl(none 0% 0% / 0.24)',
          backgroundClip: 'border-box',
        }}
      >
        <Stack
          w={300}
          h="100%"
          bdrs="8px"
          bg="oklab(0.262384 0.00252247 -0.00889932)"
          gap={8}
        >
          <Box mih={140} pos="relative">
            <svg
              viewBox="0 0 300 105"
              style={{
                minHeight: '105px',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
              }}
            >
              <title>Profile header</title>
              <mask id={maskId}>
                <rect fill="white" x="0" y="0" width="100%" height="100%" />
                <circle fill="black" cx="56" cy="101" r="46" />
              </mask>
              <foreignObject
                width="100%"
                height="100%"
                mask={`url(#${maskId})`}
              >
                <Box h={105} bg="black"></Box>
              </foreignObject>
            </svg>
            <Box top={61} left={16} pos="absolute">
              <UserAvatar name={props.name} size={80} />
            </Box>
          </Box>
          <Stack pr="md" pl="md" pb={8} pt={4}>
            <Box>
              <Text size="xl" fw={700} lh="24px" className="wrap-break-word">
                {props.displayName ?? props.name}
              </Text>
              <Text size="sm" lh="18px" className="wrap-break-word">
                {props.name}
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
