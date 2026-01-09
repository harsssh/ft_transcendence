import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import {
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
  IconTrash,
} from '@tabler/icons-react'
import { useCallback, useEffect } from 'react'
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
import { NewGuildFormSchema } from '../model/newGuildForm'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export default function GuildRoute() {
  const { guild } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const { setSecondaryNavbar, setSecondaryNavbarWidth } =
    useOutletContext<ChannelsOutletContext>()
  const submit = useSubmit()
  const [opened, { open, close }] = useDisclosure(false)
  const [form, fields] = useForm({
    lastResult: actionData,
    constraint: getZodConstraint(NewGuildFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewGuildFormSchema })
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

  useEffect(() => {
    if (actionData?.status === 'success') {
      close()
    }
  }, [actionData, close])

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
              <Menu.Item rightSection={<IconCookieMan size={18} />}>
                Invite to Server
              </Menu.Item>
              <Menu.Item rightSection={<IconPencil size={18} />} onClick={open}>
                Rename Server
              </Menu.Item>
              <Menu.Item rightSection={<IconPlus size={18} />}>
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
    open,
  ])

  return (
    <>
      <Flex h="100%" align="center" justify="center" direction="column">
        <Text c="dimmed">Select a channel</Text>
      </Flex>

      <Modal opened={opened} onClose={close} title="Rename Server" centered>
        <Form method="post" {...getFormProps(form)}>
          <Stack gap="sm">
            {form.errors && (
              <Alert variant="light" color="red">
                {form.errors}
              </Alert>
            )}
            <Text size="sm" mb="sm" c="dimmed">
              Enter a new name for your server.
            </Text>
            <TextInput
              {...getInputProps(fields.name, { type: 'text' })}
              label="Server Name"
              placeholder="Enter server name"
              name="name"
              defaultValue={guild.name}
              data-autofocus
              required
              mb="md"
              error={fields.name.errors}
            />
          </Stack>
          <input type="hidden" name="intent" value="rename-server" />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Group>
        </Form>
      </Modal>
    </>
  )
}
