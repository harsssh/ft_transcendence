import { getFormProps, getInputProps, useForm } from '@conform-to/react'
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
  Form,
  NavLink,
  useActionData,
  useLoaderData,
  useOutletContext,
  useSubmit,
} from 'react-router'
import { authMiddleware } from '../../../middlewares/auth'
import type { ChannelsOutletContext } from '../route'
import type { Route } from './+types/route'
import { action } from './api/action.server'
import { loader } from './api/loader.server'

export { loader, action }

import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { SignupFormSchema } from '../../_auth+/signup+/model/signupForm'
import { NewGuildFormSchema } from '../model/newGuildForm'
import { NewChannelFormSchema } from './model/newChannelForm'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

const InviteFriendSchema = SignupFormSchema.pick({ name: true })

export default function GuildRoute() {
  const { guild } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const { setSecondaryNavbar, setSecondaryNavbarWidth } =
    useOutletContext<ChannelsOutletContext>()
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
    lastResult:
      actionData?.initialValue?.['intent'] === 'rename-server'
        ? actionData
        : undefined,
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
    lastResult:
      actionData?.initialValue?.['intent'] === 'invite-friend'
        ? actionData
        : undefined,
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
    lastResult:
      actionData?.initialValue?.['intent'] === 'create-channel'
        ? actionData
        : undefined,
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
    lastResult:
      actionData?.initialValue?.['intent'] === 'rename-channel'
        ? actionData
        : undefined,
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
    if (actionData?.status === 'success') {
      closeRenameServer()
      closeInvite()
      closeCreateChannel()
      closeRenameChannel()
      setTargetChannel(null)
    }
  }, [
    actionData,
    closeRenameServer,
    closeInvite,
    closeCreateChannel,
    closeRenameChannel,
  ])

  useEffect(() => {
    setSecondaryNavbarWidth(240)
    setSecondaryNavbar(
      <Flex direction="column" h="100%" w={240}>
        <Flex
          h={48}
          align="center"
          px="md"
          className="border-b font-bold truncate"
          style={{ borderColor: 'var(--app-shell-border-color)' }}
        >
          <Menu position="bottom-start" shadow="md" width={210}>
            <Menu.Target>
              <Button
                variant="light"
                color="neutral"
                radius="md"
                className="rounded-md"
              >
                <Text truncate="end">{guild.name}</Text>
                <IconChevronDown size={14} style={{ flexShrink: 0 }} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                rightSection={<IconCookieMan size={18} />}
                onClick={openInvite}
              >
                Invite to Server
              </Menu.Item>
              <Menu.Item
                rightSection={<IconPencil size={18} />}
                onClick={openRenameServer}
              >
                Rename Server
              </Menu.Item>
              <Menu.Item
                rightSection={<IconPlus size={18} />}
                onClick={openCreateChannel}
              >
                Create Channel
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                rightSection={<IconLogout size={18} />}
                onClick={handleLeaveServer}
              >
                Leave Server
              </Menu.Item>
              <Menu.Item
                color="red"
                rightSection={<IconTrash size={18} />}
                onClick={handleDeleteServer}
              >
                Delete Server
              </Menu.Item>
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
                  </Menu.Dropdown>
                </Menu>
              }
              variant="light"
              className="rounded-md"
            />
          ))}
        </Flex>
      </Flex>,
    )

    return () => {
      setSecondaryNavbar(null)
      setSecondaryNavbarWidth(0)
    }
  }, [
    guild,
    setSecondaryNavbar,
    setSecondaryNavbarWidth,
    handleDeleteServer,
    handleLeaveServer,
    openRenameServer,
    openInvite,
    openCreateChannel,
    openRenameChannel,
    handleDeleteChannel,
  ])

  return (
    <>
      <Flex h="100%" align="center" justify="center" direction="column">
        <Text c="dimmed">Select a channel</Text>
      </Flex>

      <Modal
        opened={renameServerOpened}
        onClose={closeRenameServer}
        title="Rename Server"
        centered
      >
        <Form method="post" {...getFormProps(renameServerForm)}>
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
            <Button type="submit">Save</Button>
          </Group>
        </Form>
      </Modal>

      <Modal
        opened={inviteOpened}
        onClose={closeInvite}
        title="Invite Friend"
        centered
      >
        <Form method="post" {...getFormProps(inviteForm)}>
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
            <Button type="submit">Invite</Button>
          </Group>
        </Form>
      </Modal>

      <Modal
        opened={createChannelOpened}
        onClose={closeCreateChannel}
        title="Create Channel"
        centered
      >
        <Form method="post" {...getFormProps(createChannelForm)}>
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
            <Button type="submit">createChannel</Button>
          </Group>
        </Form>
      </Modal>

      <Modal
        opened={renameChannelOpened}
        onClose={closeRenameChannel}
        title="Rename Channel"
        centered
      >
        <Form
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
            <Button type="submit">Save</Button>
          </Group>
        </Form>
      </Modal>
    </>
  )
}
