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
import { ok, ResultAsync } from 'neverthrow'
import { useEffect, useMemo, useRef } from 'react'
import { Form, useLoaderData, useNavigation } from 'react-router'
import { z } from 'zod'
import { messages } from '../../../../../db/schema'
import { dbContext } from '../../../../contexts/db'
import { userContext } from '../../../../contexts/user'
import type { Route } from './+types/route'
import { DateSeparator } from './ui/DateSeparator'
import { Message } from './ui/Message'

const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
})

export const loader = async ({ context, params }: Route.LoaderArgs) => {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const { data: channelId, success } = z.coerce
    .number()
    .safeParse(params.channelId)

  if (!success) {
    throw new Response('Bad Request', { status: 400 })
  }

  const result = await ResultAsync.fromPromise(
    db.query.channels.findFirst({
      where: {
        id: channelId,
      },
      with: {
        participants: true,
        messages: {
          with: {
            sender: true,
          },
        },
      },
    }),
    (val) => val,
  )
    .andThen((channel) => {
      if (!channel) {
        return ResultAsync.fromSafePromise(Promise.reject('Channel not found'))
      }

      const partner = channel.participants.find((p) => p.id !== user.id)
      const sortedMessages = channel.messages.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      )

      return ok({
        messages: sortedMessages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          sender: {
            id: m.sender.id,
            name: m.sender.name,
          },
        })),
        partner: partner ? { id: partner.id, name: partner.name } : null,
        user: { id: user.id },
      })
    })
    .match(
      (val) => val,
      () => {
        throw new Response('Channel not found', { status: 404 })
      },
    )

  return result
}

type LoaderData = Awaited<ReturnType<typeof loader>>
type MessageEntry = LoaderData['messages'][number]
type MessageListItem =
  | { kind: 'separator'; date: string }
  | { kind: 'message'; message: MessageEntry }

export const action = async ({
  context,
  request,
  params,
}: Route.ActionArgs) => {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SendMessageSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const db = context.get(dbContext)
  const channelId = Number(params.channelId)

  await db.insert(messages).values({
    content: submission.value.content,
    channelId,
    senderId: user.id,
  })

  return submission.reply({ resetForm: true })
}

export default function DMChannel({ actionData }: Route.ComponentProps) {
  const { messages, partner } = useLoaderData<typeof loader>()
  const scrollViewport = useRef<HTMLDivElement>(null)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const messagesWithSeparators = useMemo<MessageListItem[]>(
    () =>
      messages.flatMap((message, index) => {
        const currentDate = message.createdAt.toLocaleDateString()
        const previousMsg = messages[index - 1]
        const previousDate = previousMsg
          ? previousMsg.createdAt.toLocaleDateString()
          : null
        const entries: MessageListItem[] = []

        if (currentDate !== previousDate) {
          entries.push({ kind: 'separator', date: currentDate })
        }

        entries.push({ kind: 'message', message })
        return entries
      }),
    [messages],
  )

  useEffect(() => {
    if (scrollViewport.current) {
      scrollViewport.current.scrollTo({
        top: scrollViewport.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [])

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
        viewportRef={scrollViewport}
        p="md"
        style={{ minHeight: 0 }}
        styles={{
          viewport: { overscrollBehavior: 'contain' },
        }}
      >
        <Stack gap="xs">
          {messagesWithSeparators.map((entry, index) =>
            entry.kind === 'separator' ? (
              <DateSeparator
                key={`separator-${entry.date}-${index}`}
                date={entry.date}
              />
            ) : (
              <Message
                key={entry.message.id}
                senderName={entry.message.sender.name}
                content={entry.message.content}
                createdAt={entry.message.createdAt}
              />
            ),
          )}
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
