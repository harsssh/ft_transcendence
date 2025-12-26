import { differenceInMinutes } from 'date-fns'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  Affix,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSend } from '@tabler/icons-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Form, useNavigation } from 'react-router'
import type { Route } from './+types/route'
import { SendMessageSchema } from './model/message'
import { DateSeparator } from './ui/DateSeparator'
import { Message } from './ui/Message'
import { UserAvatar } from './ui/UserAvatar'

export { action } from './api/action.server'
export { loader } from './api/loader.server'

export default function DMChannel({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { messages: initialMessages, partner, locale } = loaderData
  const channelId = params.channelId
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const [messages, setMessages] = useState(initialMessages)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingMessagesRef = useRef<string[]>([])
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed'>(
    'closed',
  )
  const reconnectTimeoutRef = useRef<number>(0)
  const reconnectAttemptsRef = useRef<number>(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const timeZone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    () => 'UTC',
  )

  const checkIfAtBottom = useCallback(() => {
    if (!viewportRef.current) return true

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
    const threshold = 100 // pixels from bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold
    setIsAtBottom(atBottom)
    return atBottom
  }, [])

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      })
      setUnreadCount(0)
      setIsAtBottom(true)
    }
  }, [])

  const latestMessageRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      // Only auto-scroll if at bottom
      if (isAtBottom) {
        node.scrollIntoView({ block: 'end' })
      }
    },
    [isAtBottom],
  )

  // WebSocket connection with reconnection
  useEffect(() => {
    if (!channelId) return

    let mounted = true
    let ws: WebSocket | null = null

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws/channels/${channelId}`
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        if (!mounted) return
        console.log(`WebSocket connected`)
        setWsStatus('open')
        reconnectAttemptsRef.current = 0

        // Send pending messages
        if (pendingMessagesRef.current.length > 0) {
          for (const message of pendingMessagesRef.current) {
            ws?.send(message)
          }
          pendingMessagesRef.current = []
        }
      }

      ws.onmessage = (event) => {
        if (!mounted) return
        console.log('Message received:', event.data)
        try {
          const payload = JSON.parse(event.data)

          if (payload.type === 'message' && payload.data) {
            const newMessage = {
              ...payload.data,
              createdAt: new Date(payload.data.createdAt), // Parse string to Date
            }

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })

            const atBottom = checkIfAtBottom()
            if (!atBottom) {
              setUnreadCount((prev) => prev + 1)
            } else {
              setTimeout(() => scrollToBottom(), 0)
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        if (!mounted) return
        console.log('WebSocket disconnected')
        setWsStatus('closed')

        // Reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            1000 * 2 ** reconnectAttemptsRef.current,
            30000,
          )
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`,
          )
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    }

    setWsStatus('connecting')
    connect()

    return () => {
      mounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      ws?.close()
    }
  }, [channelId, checkIfAtBottom, scrollToBottom])

  // Sync with loader data
  useEffect(() => {
    setMessages(initialMessages)
    setUnreadCount(0)
  }, [initialMessages])

  // Handle form submission success - scroll to bottom
  useEffect(() => {
    if (navigation.state === 'idle' && actionData?.status === 'success') {
      setTimeout(() => {
        scrollToBottom()
      }, 0)
    }
  }, [navigation.state, actionData, scrollToBottom])

  const messagesWithSeparators = useMemo(() => {
    // Use the server snapshot timezone for SSR/hydration, then re-render in client timezone.
    const dateFormatter = new Intl.DateTimeFormat(locale, { timeZone })

    return messages.flatMap((message, index) => {
      const currentDate = dateFormatter.format(message.createdAt)
      const previousMsg = messages[index - 1]
      const previousDate = previousMsg
        ? dateFormatter.format(previousMsg.createdAt)
        : null
      const messageEntry = {
        kind: 'message',
        message: {
          ...message,
          withProfile:
            previousMsg?.sender.id !== message.sender.id ||
            currentDate !== previousDate ||
            differenceInMinutes(message.createdAt, previousMsg.createdAt) > 5,
        },
      } as const

      if (currentDate !== previousDate) {
        return [{ kind: 'separator', date: currentDate } as const, messageEntry]
      }

      return [messageEntry]
    })
  }, [locale, messages, timeZone])

  const [form, fields] = useForm({
    lastResult: actionData,
    constraint: getZodConstraint(SendMessageSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SendMessageSchema })
    },
    onSubmit(event, { formData }) {
      const content = formData.get('content')
      if (!content) return

      event.preventDefault()

      const messageData = {
        id: Date.now(), // Temporary ID
        content: content.toString(),
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(messageData))
        event.currentTarget.reset() // Clear input
      } else {
        console.log('WebSocket not ready, queueing')
        pendingMessagesRef.current.push(JSON.stringify(messageData))
      }
    },
  })

  return (
    <Stack
      gap={0}
      h="calc(100dvh - var(--app-shell-footer-offset, 0rem))"
      style={{
        minHeight: 0,
        overflow: 'hidden',
        overscrollBehavior: 'contain',
        position: 'relative',
      }}
    >
      <Box
        p="md"
        style={{
          borderBottom: '1px solid var(--transcendence-border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <Group>
          <UserAvatar name={partner?.name} />
          <Text fw="bold" size="lg">
            {partner?.name ?? 'Unknown User'}
          </Text>
        </Group>
      </Box>

      {wsStatus !== 'open' && (
        <Box
          p="xs"
          style={{
            backgroundColor:
              wsStatus === 'connecting'
                ? 'var(--mantine-color-yellow-9)'
                : 'var(--mantine-color-red-9)',
            color: 'white',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          {wsStatus === 'connecting'
            ? 'Connecting...'
            : 'Disconnected - Retrying...'}
        </Box>
      )}

      {unreadCount > 0 && (
        <Affix
          position={{ top: 80, left: 0, right: 0 }}
          style={{ zIndex: 2, pointerEvents: 'none' }}
        >
          <Box
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Button
              variant="filled"
              size="sm"
              onClick={scrollToBottom}
              style={{ pointerEvents: 'auto' }}
            >
              {unreadCount} {unreadCount === 1 ? 'message' : 'messages'}
            </Button>
          </Box>
        </Affix>
      )}

      <ScrollArea
        ref={scrollAreaRef}
        flex={1}
        pb="md"
        style={{ minHeight: 0 }}
        styles={{
          viewport: { overscrollBehavior: 'contain' },
        }}
        viewportRef={viewportRef}
        onScrollPositionChange={checkIfAtBottom}
      >
        <Stack gap={0}>
          {messagesWithSeparators.map((entry, index) => {
            if (entry.kind === 'separator') {
              return (
                <DateSeparator
                  key={`separator-${entry.date}-${index}`}
                  date={entry.date}
                />
              )
            }

            const isLatest = index === messagesWithSeparators.length - 1

            return (
              <div
                key={entry.message.id}
                ref={isLatest ? latestMessageRef : undefined}
              >
                <Message
                  senderName={entry.message.sender.name}
                  content={entry.message.content}
                  createdAt={entry.message.createdAt}
                  withProfile={entry.message.withProfile}
                />
              </div>
            )
          })}
        </Stack>
      </ScrollArea>

      <Box
        p="md"
        style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--transcendence-border-color)',
          flexShrink: 0,
        }}
      >
        <Form method="post" {...getFormProps(form)}>
          <Group align="flex-start">
            <TextInput
              {...getInputProps(fields.content, { type: 'text' })}
              placeholder={`Message @${partner?.name ?? 'user'}`}
              style={{ flex: 1 }}
              key={fields.content.key}
            />
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={wsStatus !== 'open'}
            >
              <IconSend size={16} />
            </Button>
          </Group>
        </Form>
      </Box>
    </Stack>
  )
}
