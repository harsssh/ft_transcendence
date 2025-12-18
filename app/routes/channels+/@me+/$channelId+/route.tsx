import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  Avatar,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSend } from '@tabler/icons-react'
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { Form, useNavigation } from 'react-router'
import type { Route } from './+types/route'
import { SendMessageSchema } from './model/message'
import { DateSeparator } from './ui/DateSeparator'
import { Message } from './ui/Message'

export { action } from './api/action.server'
export { loader } from './api/loader.server'

type MessageEntry = Route.ComponentProps['loaderData']['messages'][number]
type MessageListItem =
  | { kind: 'separator'; date: string }
  | { kind: 'message'; message: MessageEntry }

export default function DMChannel({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { messages, partner, locale } = loaderData
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const timeZone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    () => 'UTC',
  )
  const latestMessageRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return
    }
    node.scrollIntoView({ block: 'end' })
  }, [])

  const messagesWithSeparators = useMemo<MessageListItem[]>(() => {
    // Use the server snapshot timezone for SSR/hydration, then re-render in client timezone.
    const dateFormatter = new Intl.DateTimeFormat(locale, { timeZone })

    return messages.flatMap((message, index) => {
      const currentDate = dateFormatter.format(message.createdAt)
      const previousMsg = messages[index - 1]
      const previousDate = previousMsg
        ? dateFormatter.format(previousMsg.createdAt)
        : null
      const entries: MessageListItem[] = []

      if (currentDate !== previousDate) {
        entries.push({ kind: 'separator', date: currentDate })
      }

      entries.push({ kind: 'message', message })
      return entries
    })
  }, [locale, messages, timeZone])

  const [form, fields] = useForm({
    lastResult: actionData,
    constraint: getZodConstraint(SendMessageSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SendMessageSchema })
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
      }}
    >
      <Box
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-dark-4)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: 'var(--mantine-color-body)',
          flexShrink: 0,
        }}
      >
        <Group>
          <Avatar radius="xl" color="initials">
            {partner?.name?.slice(0, 2).toUpperCase() ?? '??'}
          </Avatar>
          <Text fw="bold" size="lg">
            {partner?.name ?? 'Unknown User'}
          </Text>
        </Group>
      </Box>

      <ScrollArea
        flex={1}
        p="md"
        style={{ minHeight: 0 }}
        styles={{
          viewport: { overscrollBehavior: 'contain' },
        }}
      >
        <Stack gap="xs">
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
          backgroundColor: 'var(--mantine-color-body)',
          borderTop: '1px solid var(--mantine-color-dark-4)',
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
            <Button type="submit" loading={isSubmitting}>
              <IconSend size={16} />
            </Button>
          </Group>
        </Form>
      </Box>
    </Stack>
  )
}
