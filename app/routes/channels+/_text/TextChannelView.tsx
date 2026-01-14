import type { SubmissionResult } from '@conform-to/react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  Affix,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  TextInput,
} from '@mantine/core'
import { IconSend } from '@tabler/icons-react'
import { differenceInMinutes } from 'date-fns'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createWebSocket } from '../../_shared/lib/websocket'
import { DateSeparator } from '../ui/DateSeparator'
import { EditProfileContext } from '../ui/EditProfileModal'
import { Message } from '../ui/Message'
import {
  MessageSchema,
  type MessageType,
  SendMessageSchema,
} from './model/message'

export type TextChannelViewProps = {
  channelId: string
  initialMessages: MessageType[]
  locale: string | undefined
  websocketUrl: string
  headerContent: React.ReactNode
  inputPlaceholder: string
  asideContent?: React.ReactNode
  actionData: SubmissionResult<string[]> | null
}

export function TextChannelView({
  channelId,
  initialMessages,
  locale,
  websocketUrl,
  headerContent,
  inputPlaceholder,
  asideContent,
  actionData,
}: TextChannelViewProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
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
    const atBottom = scrollHeight - scrollTop - clientHeight < 1
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
      createWebSocket(websocketUrl).match(
        (socket) => {
          ws = socket

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
            try {
              const {
                success,
                data: newMessage,
                error,
              } = MessageSchema.safeParse(JSON.parse(event.data))

              if (!success) {
                console.log('Invalid message format:', error)
                return
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
        },
        (error) => {
          console.log('WebSocket connection failed:', error)
        },
      )
    }

    setWsStatus('connecting')
    connect()

    return () => {
      mounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [channelId, websocketUrl, checkIfAtBottom, scrollToBottom])

  // Sync with loader data
  useEffect(() => {
    setMessages(initialMessages)
    setUnreadCount(0)
  }, [initialMessages])

  const messagesWithSeparators = useMemo(() => {
    // Use the server snapshot timezone for SSR/hydration, then re-render in client timezone.
    const dateFormatter = new Intl.DateTimeFormat(locale ?? 'en-US', {
      timeZone,
    })

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
    constraint: getZodConstraint(SendMessageSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SendMessageSchema })
    },
    onSubmit(event, { formData }) {
      const content = formData.get('content')
      if (!content) return

      event.preventDefault()

      const messageData = {
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

  const headerHeight = 48

  const component = (
    <Stack
      gap={0}
      h="calc(100dvh - var(--app-shell-header-offset, 0rem))"
      style={{
        borderTop: '1px solid var(--ft-border-color)',
        overscrollBehavior: 'contain',
        position: 'relative',
      }}
    >
      <Group
        h={headerHeight}
        align="center"
        justify="space-between"
        pl="md"
        pr="md"
        gap="xs"
        style={{
          borderBottom: '1px solid var(--ft-border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {headerContent}
      </Group>

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

      <Group gap={0}>
        <Stack
          flex={1}
          h={`calc(100dvh - var(--app-shell-header-offset, 0rem) - ${headerHeight}px)`}
          gap={0}
          justify="end"
        >
          <ScrollArea
            offsetScrollbars="y"
            overscrollBehavior="contain"
            viewportRef={viewportRef}
            onScrollPositionChange={checkIfAtBottom}
          >
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
              console.log(entry.message)

              return (
                <div
                  key={entry.message.id}
                  ref={isLatest ? latestMessageRef : undefined}
                  {...(index === messagesWithSeparators.length - 1
                    ? { style: { paddingBottom: '24px' } }
                    : {})}
                >
                  <Message
                    senderId={entry.message.sender.id}
                    senderName={entry.message.sender.name}
                    senderDisplayName={entry.message.sender.displayName}
                    avatarSrc={entry.message.sender.avatarUrl}
                    content={entry.message.content}
                    createdAt={entry.message.createdAt}
                    withProfile={entry.message.withProfile}
                    roles={entry.message.sender.roles}
                  />
                </div>
              )
            })}
          </ScrollArea>

          <Box
            p="md"
            style={{
              position: 'sticky',
              bottom: 0,
              borderTop: '1px solid var(--ft-border-color)',
              flexShrink: 0,
            }}
          >
            <form {...getFormProps(form)}>
              <Group align="flex-start">
                <TextInput
                  {...getInputProps(fields.content, { type: 'text' })}
                  key={fields.content.key}
                  placeholder={inputPlaceholder}
                  style={{ flex: 1 }}
                  disabled={wsStatus !== 'open'}
                  error={fields.content.errors?.[0]}
                />
                <Button type="submit" disabled={wsStatus !== 'open'}>
                  <IconSend size={16} />
                </Button>
              </Group>
            </form>
          </Box>
        </Stack>
        {asideContent}
      </Group>
    </Stack>
  )

  return (
    <EditProfileContext.Provider
      value={{
        lastResult: actionData ?? null,
      }}
    >
      {component}
    </EditProfileContext.Provider>
  )
}
