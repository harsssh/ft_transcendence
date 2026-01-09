import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  ActionIcon,
  Alert,
  Avatar,
  Button,
  Flex,
  Modal,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCirclePlusFilled,
  IconMessageCircleFilled,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import {
  Form,
  NavLink,
  Outlet,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from 'react-router'
import { dbContext } from '../../contexts/db'
import { userContext } from '../../contexts/user'
import { authMiddleware } from '../../middlewares/auth'
import { Scaffold } from '../_shared/ui/Scaffold'
import type { Route } from './+types/route'

import { action } from './api/action.server'

export { action }

import { NewGuildFormSchema } from './model/newGuildForm'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export type ChannelsOutletContext = {
  setSecondaryNavbar: (node: React.ReactNode) => void
  setSecondaryNavbarWidth: (width: number) => void
}

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)

  const currentUser = await db.query.users.findFirst({
    where: {
      id: user.id,
    },
    with: {
      guilds: true,
    },
  })

  return {
    guilds: currentUser?.guilds ?? [],
  }
}

export default function Channels() {
  const { guilds } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [secondaryNavbar, setSecondaryNavbar] =
    useState<React.ReactNode | null>(null)
  const [secondaryNavbarWidth, setSecondaryNavbarWidth] = useState<number>(0)

  return (
    <Scaffold
      navbar={
        <Navbar guilds={guilds} lastResult={actionData ?? null}>
          {secondaryNavbar}
        </Navbar>
      }
      navbarWidth={72 + secondaryNavbarWidth}
    >
      <Outlet
        context={
          {
            setSecondaryNavbar,
            setSecondaryNavbarWidth,
          } satisfies ChannelsOutletContext
        }
      />
    </Scaffold>
  )
}

type NavbarProps = {
  children: React.ReactNode
  guilds: { id: number; name: string; icon: string | null }[]
  lastResult: (SubmissionResult<string[]> & { guildId?: string }) | null
}

function Navbar({ children, guilds, lastResult }: NavbarProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(NewGuildFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewGuildFormSchema })
    },
  })
  const navigation = useNavigation()
  const navigate = useNavigate()
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    if (lastResult?.status === 'success' && lastResult.guildId) {
      close()
      navigate(`/channels/${lastResult.guildId}`)
    }
  }, [lastResult, close, navigate])
  return (
    <Flex
      justify="flex-start"
      align="flex-start"
      direction="row"
      wrap="nowrap"
      h="100%"
    >
      <Stack
        p="sm"
        align="center"
        justify="flex-start"
        h="100%"
        className="border-r gap-4"
        style={{ borderRightColor: 'var(--app-shell-border-color)' }}
      >
        <Tooltip label="Direct Messages" position="right" withArrow>
          <NavLink to="/channels/@me">
            {({ isActive }) => (
              <Avatar
                radius="md"
                variant="filled"
                size={48}
                color={isActive ? 'indigo' : 'gray'}
                className="transition-all hover:rounded-xl cursor-pointer"
              >
                <IconMessageCircleFilled />
              </Avatar>
            )}
          </NavLink>
        </Tooltip>

        <div className="w-8 h-0.5 bg-gray-700/50 rounded-full" />

        {guilds.map((guild) => (
          <Tooltip key={guild.id} label={guild.name} position="right" withArrow>
            <NavLink to={`/channels/${guild.id}`}>
              {({ isActive }) => (
                <Avatar
                  src={guild.icon}
                  radius="lg"
                  variant="filled"
                  size={48}
                  color={isActive ? 'indigo' : 'gray'}
                  className="transition-all hover:rounded-xl cursor-pointer"
                >
                  {guild.name.substring(0, 2).toUpperCase()}
                </Avatar>
              )}
            </NavLink>
          </Tooltip>
        ))}

        <Tooltip label="Add a Server" position="right" withArrow>
          <ActionIcon
            variant="subtle"
            color="neutral"
            size={48}
            radius="md"
            className="transition-all hover:rounded-xl"
            onClick={open}
          >
            <IconCirclePlusFilled size={28} />
          </ActionIcon>
        </Tooltip>

        <Modal
          opened={opened}
          onClose={close}
          title="Create New Server"
          centered
        >
          <Form method="post" action="/channels" {...getFormProps(form)}>
            <Stack gap="sm">
              {form.errors && (
                <Alert variant="light" color="red">
                  {form.errors}
                </Alert>
              )}
              <TextInput
                {...getInputProps(fields.name, { type: 'text' })}
                label="Server Name"
                error={fields.name.errors}
              />
              <Button type="submit" loading={isSubmitting} fullWidth>
                Create
              </Button>
            </Stack>
          </Form>
        </Modal>
      </Stack>
      {children}
    </Flex>
  )
}
