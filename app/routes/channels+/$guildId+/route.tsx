import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  ActionIcon,
  Alert,
  Button,
  Flex,
  Group,
  NavLink as MantineNavLink,
  Menu,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import {
  IconChevronDown,
  IconCookieMan,
  IconHash,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useFetcher,
  useLoaderData,
  useOutletContext,
  useSubmit,
} from 'react-router'
import { authMiddleware } from '../../../middlewares/auth'
import { SignupFormSchema } from '../../_auth+/signup+/model/signupForm'
import { SecondaryNavbar } from '../../_shared/ui/SecondaryNavbar'
import { hasPermission, Permissions } from '../_shared/permissions'
import { NewGuildFormSchema } from '../model/newGuildForm'
import type { ChannelsOutletContext } from '../route'
import type { Route } from './+types/route'
import { action } from './api/action.server'
import { loader } from './api/loader.server'
import { NewChannelFormSchema } from './model/newChannelForm'

export { loader, action }

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

const InviteFriendSchema = SignupFormSchema.pick({ name: true })

export type GuildOutletContext = {
  guild: Awaited<ReturnType<typeof loader>>['guild']
  loggedInUser: Awaited<ReturnType<typeof loader>>['loggedInUser']
}

export default function GuildRoute() {
  const { guild, loggedInUser } = useLoaderData<typeof loader>()

  const renameServerFetcher = useFetcher<typeof action>()
  const inviteFetcher = useFetcher<typeof action>()
  const createChannelFetcher = useFetcher<typeof action>()
  const renameChannelFetcher = useFetcher<typeof action>()

  const isOwner = guild.ownerId === loggedInUser.id
  const canManageGuild = hasPermission(
    loggedInUser.permissionsMask,
    Permissions.MANAGE_GUILD,
  )
  const canManageChannels = hasPermission(
    loggedInUser.permissionsMask,
    Permissions.MANAGE_CHANNELS,
  )
  const canCreateInvite = hasPermission(
    loggedInUser.permissionsMask,
    Permissions.CREATE_INVITE,
  )

  const { setSecondaryNavbar } = useOutletContext<ChannelsOutletContext>()

  const submit = useSubmit()
  const [
    renameServerOpened,
    { open: openRenameServer, close: closeRenameServer },
  ] = useDisclosure(false)
  const [inviteOpened, { open: openInvite, close: closeInvite }] =
    useDisclosure(false)
  const [
    createChannelOpened,
    { open: openCreateChannel, close: closeCreateChannel },
  ] = useDisclosure(false)
  const [
    renameChannelOpened,
    { open: openRenameChannel, close: closeRenameChannel },
  ] = useDisclosure(false)

  const [targetChannel, setTargetChannel] = useState<
    (typeof guild.channels)[number] | null
  >(null)

  const [renameServerForm, renameServerFields] = useForm({
    id: 'rename-server',
    defaultValue: { name: guild.name },
    lastResult: renameServerFetcher.data,
    constraint: getZodConstraint(NewGuildFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewGuildFormSchema })
    },
  })

  const [inviteForm, inviteFields] = useForm({
    id: 'invite-friend',
    defaultValue: { name: '' },
    lastResult: inviteFetcher.data,
    constraint: getZodConstraint(InviteFriendSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: InviteFriendSchema })
    },
  })

  const [createChannelForm, createChannelFields] = useForm({
    id: 'create-channel',
    defaultValue: { name: '' },
    lastResult: createChannelFetcher.data,
    constraint: getZodConstraint(NewChannelFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewChannelFormSchema })
    },
  })

  const [renameChannelForm, renameChannelFields] = useForm({
    id: 'rename-channel',
    defaultValue: { name: '' },
    lastResult: renameChannelFetcher.data,
    constraint: getZodConstraint(NewChannelFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewChannelFormSchema })
    },
  })

  const handleDeleteServer = useCallback(() => {
    modals.openConfirmModal({
      title: (
        <Text fw={700} className="break-all">
          Delete '{guild.name}'
        </Text>
      ),
      children: (
        <Text size="sm">
          Are you sure you want to delete{' '}
          <Text span fw={700} className="break-all">
            {guild.name}
          </Text>
          ? This action cannot be undone.
        </Text>
      ),
      centered: true,
      labels: { confirm: 'Delete Server', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const formData = new FormData()
        formData.append('intent', 'delete-server')
        submit(formData, { method: 'post' })
      },
    })
  }, [guild.name, submit])

  const handleLeaveServer = useCallback(() => {
    modals.openConfirmModal({
      title: (
        <Text fw={700} className="break-all">
          Leave '{guild.name}'
        </Text>
      ),
      children: (
        <Text size="sm">
          Are you sure you want to leave{' '}
          <Text span fw={700} className="break-all">
            {guild.name}
          </Text>
          ? You won't be able to rejoin this server unless you are re-invited.
        </Text>
      ),
      centered: true,
      labels: { confirm: 'Leave Server', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const formData = new FormData()
        formData.append('intent', 'leave-server')
        submit(formData, { method: 'post' })
      },
    })
  }, [guild.name, submit])

  const handleDeleteChannel = useCallback(
    (targetChannel: (typeof guild.channels)[number]) => {
      modals.openConfirmModal({
        title: (
          <Text fw={700} className="break-all">
            Delete '{targetChannel.name}'
          </Text>
        ),
        children: (
          <Text size="sm">
            Are you sure you want to delete{' '}
            <Text span fw={700} className="break-all">
              #{targetChannel.name}
            </Text>
            ? This action cannot be undone.
          </Text>
        ),
        centered: true,
        labels: { confirm: 'Delete Channel', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          const formData = new FormData()
          formData.append('intent', 'delete-channel')
          formData.append('channelId', String(targetChannel.id))
          submit(formData, { method: 'post' })
        },
      })
    },
    [submit],
  )

  useEffect(() => {
    if (
      renameServerFetcher.state === 'idle' &&
      renameServerFetcher.data?.status === 'success'
    ) {
      closeRenameServer()
    }
  }, [renameServerFetcher.state, renameServerFetcher.data, closeRenameServer])

  useEffect(() => {
    if (
      inviteFetcher.state === 'idle' &&
      inviteFetcher.data?.status === 'success'
    ) {
      closeInvite()
    }
  }, [inviteFetcher.state, inviteFetcher.data, closeInvite])

  useEffect(() => {
    if (
      createChannelFetcher.state === 'idle' &&
      createChannelFetcher.data?.status === 'success'
    ) {
      closeCreateChannel()
    }
  }, [
    createChannelFetcher.state,
    createChannelFetcher.data,
    closeCreateChannel,
  ])

  useEffect(() => {
    if (
      renameChannelFetcher.state === 'idle' &&
      renameChannelFetcher.data?.status === 'success'
    ) {
      closeRenameChannel()
      setTargetChannel(null)
    }
  }, [
    renameChannelFetcher.state,
    renameChannelFetcher.data,
    closeRenameChannel,
  ])

  useEffect(() => {
    setSecondaryNavbar(
      <SecondaryNavbar>
        <Flex direction="column" h="100%" w={300}>
          <Flex
            h={48}
            align="center"
            px="md"
            className="border-b font-bold truncate"
          >
            <Menu position="bottom-start" shadow="md" width={210}>
              <Menu.Target>
                <Button
                  variant="light"
                  color="neutral"
                  radius="md"
                  className="rounded-md"
                >
                  <Text fw="bold" truncate="end">
                    {guild.name}
                  </Text>
                  <IconChevronDown size={14} style={{ flexShrink: 0 }} />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {canCreateInvite && (
                  <Menu.Item
                    rightSection={<IconCookieMan size={18} />}
                    onClick={openInvite}
                  >
                    Invite to Server
                  </Menu.Item>
                )}
                {canManageGuild && (
                  <Menu.Item
                    rightSection={<IconPencil size={18} />}
                    onClick={openRenameServer}
                  >
                    Rename Server
                  </Menu.Item>
                )}
                {canManageChannels && (
                  <Menu.Item
                    rightSection={<IconPlus size={18} />}
                    onClick={openCreateChannel}
                  >
                    Create Channel
                  </Menu.Item>
                )}
                <Menu.Divider />
                {!isOwner && (
                  <Menu.Item
                    color="red"
                    rightSection={<IconLogout size={18} />}
                    onClick={handleLeaveServer}
                  >
                    Leave Server
                  </Menu.Item>
                )}
                {isOwner && (
                  <Menu.Item
                    color="red"
                    rightSection={<IconTrash size={18} />}
                    onClick={handleDeleteServer}
                  >
                    Delete Server
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Flex>
          <Flex
            direction="column"
            p="xs"
            gap={2}
            className="flex-1 overflow-y-auto"
          >
            {guild.channels.map((channel) => (
              <MantineNavLink
                key={channel.id}
                component={NavLink}
                to={`/channels/${guild.id}/${channel.id}`}
                label={channel.name}
                leftSection={<IconHash size={20} stroke={2} />}
                rightSection={
                  <Menu position="bottom" shadow="md" width={210}>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                        }}
                      >
                        <IconSettings
                          className="text-zinc-500 hover:text-zinc-200 transion-colors"
                          size={16}
                        />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        onClick={(e) => {
                          e.preventDefault()
                          setTargetChannel(channel)
                          openRenameChannel()
                        }}
                        rightSection={<IconPencil size={18} />}
                      >
                        Rename Channel
                      </Menu.Item>
                      {canManageChannels && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteChannel(channel)
                            }}
                            rightSection={<IconTrash size={18} />}
                          >
                            Delete Channel
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                }
                variant="light"
                className="rounded-md"
              />
            ))}
          </Flex>
        </Flex>
      </SecondaryNavbar>,
    )

    return () => {
      setSecondaryNavbar(null)
    }
  }, [
    guild,
    setSecondaryNavbar,
    handleDeleteServer,
    handleLeaveServer,
    openRenameServer,
    openInvite,
    openCreateChannel,
    openRenameChannel,
    handleDeleteChannel,
    canManageGuild,
    canManageChannels,
    canCreateInvite,
    isOwner,
  ])

  return (
    <>
      <Outlet context={{ guild, loggedInUser } satisfies GuildOutletContext} />

      <Modal
        opened={renameServerOpened}
        onClose={closeRenameServer}
        title="Rename Server"
        centered
      >
        <renameServerFetcher.Form
          method="post"
          {...getFormProps(renameServerForm)}
          key={guild?.name}
        >
          <Stack gap="sm">
            {renameServerForm.errors && (
              <Alert variant="light" color="red">
                {renameServerForm.errors}
              </Alert>
            )}
            <Text size="sm" mb="sm" c="dimmed">
              Enter a new name for your server.
            </Text>
            <TextInput
              {...getInputProps(renameServerFields.name, { type: 'text' })}
              defaultValue={guild?.name ?? ''}
              label="Server Name"
              placeholder="Enter server name"
              name="name"
              required
              mb="md"
              error={renameServerFields.name.errors}
            />
          </Stack>
          <input type="hidden" name="intent" value="rename-server" />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRenameServer}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={renameServerFetcher.state !== 'idle'}
            >
              Save
            </Button>
          </Group>
        </renameServerFetcher.Form>
      </Modal>

      <Modal
        opened={inviteOpened}
        onClose={closeInvite}
        title="Invite Friend"
        centered
      >
        <inviteFetcher.Form method="post" {...getFormProps(inviteForm)}>
          <Stack gap="sm">
            {inviteForm.errors && (
              <Alert variant="light" color="red">
                {inviteForm.errors}
              </Alert>
            )}
            <Text size="sm" mb="sm" c="dimmed">
              You can invite friends with their username.
            </Text>
            <TextInput
              {...getInputProps(inviteFields.name, { type: 'text' })}
              label="Username"
              placeholder="Enter username"
              name="name"
              required
              mb="md"
              error={inviteFields.name.errors}
            />
          </Stack>
          <input type="hidden" name="intent" value="invite-friend" />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeInvite}>
              Cancel
            </Button>
            <Button type="submit" loading={inviteFetcher.state !== 'idle'}>
              Invite
            </Button>
          </Group>
        </inviteFetcher.Form>
      </Modal>

      <Modal
        opened={createChannelOpened}
        onClose={closeCreateChannel}
        title="Create Channel"
        centered
      >
        <createChannelFetcher.Form
          method="post"
          {...getFormProps(createChannelForm)}
        >
          <Stack gap="sm">
            {createChannelForm.errors && (
              <Alert variant="light" color="red">
                {createChannelForm.errors}
              </Alert>
            )}
            <TextInput
              {...getInputProps(createChannelFields.name, { type: 'text' })}
              label="Channel Name"
              placeholder="new-channel"
              name="name"
              required
              mb="md"
              error={createChannelFields.name.errors}
            />
          </Stack>
          <input type="hidden" name="intent" value="create-channel" />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCreateChannel}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createChannelFetcher.state !== 'idle'}
            >
              createChannel
            </Button>
          </Group>
        </createChannelFetcher.Form>
      </Modal>

      <Modal
        opened={renameChannelOpened}
        onClose={closeRenameChannel}
        title="Rename Channel"
        centered
      >
        <renameChannelFetcher.Form
          method="post"
          {...getFormProps(renameChannelForm)}
          key={targetChannel?.id}
        >
          <Stack gap="sm">
            {renameChannelForm.errors && (
              <Alert variant="light" color="red">
                {renameChannelForm.errors}
              </Alert>
            )}
            <Text size="sm" mb="sm" c="dimmed">
              Enter a new name for the channel.
            </Text>
            <TextInput
              {...getInputProps(renameChannelFields.name, { type: 'text' })}
              defaultValue={targetChannel?.name ?? ''}
              label="Channel Name"
              placeholder="Enter channel name"
              name="name"
              required
              mb="md"
              error={renameChannelFields.name.errors}
            />
          </Stack>
          <input type="hidden" name="intent" value="rename-channel" />
          {targetChannel && (
            <input type="hidden" name="channelId" value={targetChannel.id} />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRenameChannel}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={renameChannelFetcher.state !== 'idle'}
            >
              Save
            </Button>
          </Group>
        </renameChannelFetcher.Form>
      </Modal>
    </>
  )
}
