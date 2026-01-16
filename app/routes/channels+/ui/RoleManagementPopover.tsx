import { ActionIcon, Button, Popover, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconCircleFilled, IconPlus } from '@tabler/icons-react'
import { useFetcher } from 'react-router'
import type { GuildOutletContext } from '../$guildId+/route'
import type { Role } from './UserAvatarPopover'

type Props = {
  id: number
  roles?: Role[] | undefined
  guild?: GuildOutletContext['guild'] | undefined
}

export function RoleManagementPopover(props: Props) {
  const { id, roles, guild } = props
  const [popoverOpened, { open, close }] = useDisclosure(false)
  const fetcher = useFetcher()

  const availableRoles = guild?.roles?.filter(
    (guildRole) => !roles?.some((userRole) => userRole.id === guildRole.id),
  )

  return (
    <>
      <Popover
        position="bottom"
        onClose={close}
        opened={popoverOpened}
        withinPortal={false}
      >
        <Popover.Target>
          <ActionIcon
            variant="default"
            size={18}
            radius="xl"
            aria-label="Manage Roles"
            onClick={open}
          >
            <IconPlus size={10} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown
          p={0}
          bd="none"
          style={{
            boxShadow:
              '0 0 0 1px hsl(none 0% 100%/0.08), 0 12px 24px 0 hsl(none 0% 0% / 0.24)',
            backgroundClip: 'border-box',
          }}
        >
          {availableRoles && availableRoles.length > 0 ? (
            <Stack gap="xs" p="xs">
              {availableRoles.map((guildRole) => (
                <Button
                  key={guildRole.id}
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  justify="start"
                  fullWidth
                  leftSection={
                    <IconCircleFilled
                      color={guildRole.color}
                      size={12}
                      style={{ flexShrink: 0 }}
                    />
                  }
                  onClick={() => {
                    fetcher.submit(
                      {
                        intent: 'assign-role',
                        userId: id,
                        roleId: guildRole.id,
                      },
                      { method: 'post', action: `/channels/${guild?.id}` },
                    )
                    close()
                  }}
                >
                  <Text size="sm" truncate="end">
                    {guildRole.name}
                  </Text>
                </Button>
              ))}
            </Stack>
          ) : (
            <Text size="xs" c="dimmed" p="xs" ta="center">
              No roles available
            </Text>
          )}
        </Popover.Dropdown>
      </Popover>
    </>
  )
}
