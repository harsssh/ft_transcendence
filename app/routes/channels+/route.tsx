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
  ScrollArea,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCirclePlusFilled,
  IconMessageCircleFilled,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { Form, NavLink, Outlet, useNavigate, useNavigation } from 'react-router'
import { dbContext } from '../../contexts/db'
import {
  type OnlineStatus,
  OnlineStatusContext,
} from '../../contexts/onlineStatus'
import { LoggedInUserContext } from '../../contexts/user'
import { loggedInUserContext } from '../../contexts/user.server'
import { authMiddleware } from '../../middlewares/auth'
import { createWebSocket } from '../_shared/lib/websocket'
import { Scaffold } from '../_shared/ui/Scaffold'
import type { Route } from './+types/route'
import { NewGuildFormSchema } from './model/newGuildForm'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(loggedInUserContext)
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
    user,
    guilds: currentUser?.guilds ?? [],
  }
}

export { action } from './api/action.server'

export type ChannelsOutletContext = {
  setSecondaryNavbar: (node: React.ReactNode) => void
}

export default function Channels({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [secondaryNavbar, setSecondaryNavbar] =
    useState<React.ReactNode | null>(null)
  const [status, setStatus] = useState<OnlineStatus>('offline')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    createWebSocket(`/api/presence/ws`).match(
      (ws) => {
        wsRef.current = ws

        ws.onopen = () => {
          setStatus('online')
        }

        ws.onerror = (err) => {
          console.log('Presence websocket error:', err)
        }

        ws.onclose = () => {
          setStatus('offline')
        }
      },
      () => {},
    )

    return () => {
      const state = wsRef.current?.readyState
      if (state === WebSocket.OPEN) {
        wsRef.current?.close()
      }
      setStatus('offline')
      wsRef.current = null
    }
  }, [])

  return (
    <LoggedInUserContext.Provider value={loaderData.user}>
      <OnlineStatusContext.Provider value={status}>
        <Scaffold
          navbar={
            <Navbar guilds={loaderData.guilds} lastResult={actionData ?? null}>
              {secondaryNavbar}
            </Navbar>
          }
          navbarWidth={372}
        >
          <Outlet
            context={
              {
                setSecondaryNavbar,
              } satisfies ChannelsOutletContext
            }
          />
        </Scaffold>
      </OnlineStatusContext.Provider>
    </LoggedInUserContext.Provider>
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
      <ScrollArea type="never" h="100%">
        <Stack p="sm" align="center" justify="flex-start" h="100%">
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
            <Tooltip
              key={guild.id}
              label={guild.name}
              position="right"
              withArrow
            >
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
        </Stack>
      </ScrollArea>

      <Modal opened={opened} onClose={close} title="Create New Server" centered>
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
      {children}
    </Flex>
  )
}
