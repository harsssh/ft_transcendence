import {
  Badge,
  Box,
  Button,
  Group,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { useCallback, useId } from 'react'
import { useSubmit } from 'react-router'
import { hasPermission, Permissions } from '../_shared/permissions'
import type { GuildOutletContext } from '../$guildId+/route'
import { EditProfileModal } from './EditProfileModal'
import { RoleManagementPopover } from './RoleManagementPopover'
import { UserAvatar, type UserAvatarProps } from './UserAvatar'

export type Role = {
  id: number
  name: string
  color: string
}

type Props = Omit<UserAvatarProps, 'id' | 'withOnlineStatus'> & {
  id: number
  displayName: string | null
  isEditable: boolean
  roles?: Role[] | undefined
  guild?: GuildOutletContext['guild'] | undefined
  loggedInUser?: GuildOutletContext['loggedInUser'] | undefined
}

export function UserAvatarPopover(props: Props) {
  const { guild, loggedInUser } = props
  const maskId = useId()
  const [popoverOpened, popoverHandlers] = useDisclosure(false)
  const [editProfileModalOpened, editProfileModalHandlers] =
    useDisclosure(false)
  const canKick =
    guild && loggedInUser
      ? hasPermission(loggedInUser.permissionsMask, Permissions.KICK_MEMBERS)
      : false
  const canManageRoles =
    guild && loggedInUser
      ? hasPermission(loggedInUser.permissionsMask, Permissions.MANAGE_ROLES)
      : false

  const handleEditProfileClicked = useCallback(() => {
    popoverHandlers.close()
    editProfileModalHandlers.open()
  }, [editProfileModalHandlers, popoverHandlers])

  const submit = useSubmit()
  const handleKickMember = useCallback(() => {
    if (!guild) {
      return
    }
    popoverHandlers.close()
    modals.openConfirmModal({
      title: (
        <Text fw={700} className="break-all">
          Kick '{props.displayName ?? props.name}' from Server
        </Text>
      ),
      children: (
        <Text size="sm">
          Are you sure you want to kick{' '}
          <Text span fw={700} c="blue" className="break-all" inherit>
            {props.displayName ?? props.name}
          </Text>{' '}
          from the server? They will be able to rejoin again with a new invite.
        </Text>
      ),
      centered: true,
      labels: { confirm: 'Kick', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const formData = new FormData()
        formData.append('intent', 'kick-member')
        formData.append('userId', String(props.id))
        submit(formData, {
          method: 'post',
          action: `/channels/${guild.id}`,
        })
      },
    })
  }, [guild, submit, props.id, props.displayName, props.name, popoverHandlers])

  return (
    <>
      <Popover
        position="right-start"
        onDismiss={popoverHandlers.close}
        opened={popoverOpened}
      >
        <Popover.Target>
          <UnstyledButton
            className="active:transform-[translateY(1px)]"
            onClick={popoverHandlers.toggle}
          >
            <UserAvatar {...props} id={undefined} />
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
            pb="sm"
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
                  <Box h={105} bg="black" />
                </foreignObject>
              </svg>
              <Box top={61} left={16} pos="absolute">
                <UserAvatar size={80} {...props} withOnlineStatus />
              </Box>
            </Box>
            <Stack pr="md" pl="md" pt={4}>
              <Box>
                <Text size="xl" fw={700} lh="24px" className="wrap-break-word">
                  {props.displayName ?? props.name}
                </Text>
                <Text size="sm" lh="18px" className="wrap-break-word">
                  {props.name}
                </Text>
              </Box>
              {(props.roles && props.roles.length > 0) || canManageRoles ? (
                <Box>
                  <Group gap={4}>
                    {props.roles?.map((role) => (
                      <Badge
                        key={role.id}
                        color={role.color}
                        variant="dot"
                        size="sm"
                        tt="none"
                      >
                        {role.name}
                      </Badge>
                    ))}
                    {canManageRoles && (
                      <RoleManagementPopover
                        id={props.id}
                        guild={guild}
                        roles={props.roles}
                      />
                    )}
                  </Group>
                </Box>
              ) : null}
              {props.isEditable && (
                <Button onClick={handleEditProfileClicked}>Edit Profile</Button>
              )}
              {canKick && loggedInUser?.id !== props.id && (
                <Button color="red" onClick={handleKickMember}>
                  Kick
                </Button>
              )}
            </Stack>
          </Stack>
        </Popover.Dropdown>
      </Popover>
      <EditProfileModal
        id={props.id}
        name={props.name}
        opened={editProfileModalOpened}
        onClose={editProfileModalHandlers.close}
        defaultValue={{ displayName: props.displayName, avatarUrl: props.src }}
      />
    </>
  )
}
