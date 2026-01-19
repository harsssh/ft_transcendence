import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Pagination,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { openConfirmModal } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconCookieMan,
  IconMessageCircleFilled,
  IconX,
} from '@tabler/icons-react'
import { and, eq, or } from 'drizzle-orm'
import { ok, ResultAsync } from 'neverthrow'
import { useState } from 'react'
import { Form, useSubmit } from 'react-router'
import * as R from 'remeda'
import { friendships } from '../../../../db/schema'
import { dbContext } from '../../../contexts/db'
import { loggedInUserContext } from '../../../contexts/user.server'
import type { Route } from './+types/_index'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const formData = await request.formData()
  const intent = formData.get('intent')

  try {
    if (intent === 'send-friend-request') {
      const username = formData.get('username') as string
      if (!username) return { error: 'Username is required' }

      const targetUser = await db.query.users.findFirst({
        where: {
          name: username,
        },
      })

      if (!targetUser) return { error: 'User not found' }
      if (targetUser.id === user.id) return { error: 'Cannot add yourself' }

      let result: { error?: string; success?: string } | null = null

      await db.transaction(async (tx) => {
        const existing = await tx.query.friendships.findFirst({
          where: {
            OR: [
              {
                userId: user.id,
                friendId: targetUser.id,
              },
              {
                userId: targetUser.id,
                friendId: user.id,
              },
            ],
          },
        })

        if (existing) {
          if (existing.status === 'pending') {
            result = { error: 'Friend request already pending' }
            return
          } else if (existing.status === 'accepted') {
            result = { error: 'Already friends' }
            return
          }
        }

        await tx.insert(friendships).values({
          userId: user.id,
          friendId: targetUser.id,
          status: 'pending',
        })

        result = { success: 'Friend request sent' }
      })

      return result
    }

    if (intent === 'accept-friend-request') {
      const targetId = Number(formData.get('userId'))
      if (!targetId || Number.isNaN(targetId) || targetId <= 0)
        return { error: 'Invalid user ID' }

      const updated = await db
        .update(friendships)
        .set({ status: 'accepted' })
        .where(
          and(
            eq(friendships.userId, targetId),
            eq(friendships.friendId, user.id),
            eq(friendships.status, 'pending'),
          ),
        )
        .returning()

      if (updated.length === 0) {
        return { error: 'Friend request not found or already processed' }
      }

      return { success: 'Friend request accepted' }
    }

    if (intent === 'reject-friend-request') {
      const targetId = Number(formData.get('userId'))
      if (!targetId) return { error: 'Invalid user ID' }
      await db
        .delete(friendships)
        .where(
          and(
            eq(friendships.userId, targetId),
            eq(friendships.friendId, user.id),
            eq(friendships.status, 'pending'),
          ),
        )
      return { success: 'Friend request rejected' }
    }
    if (intent === 'cancel-friend-request') {
      const targetId = Number(formData.get('userId'))
      if (!targetId) return { error: 'Invalid user ID' }
      await db
        .delete(friendships)
        .where(
          and(
            eq(friendships.userId, user.id),
            eq(friendships.friendId, targetId),
            eq(friendships.status, 'pending'),
          ),
        )
      return { success: 'Friend request canceled' }
    }

    if (intent === 'remove-friend') {
      const targetId = Number(formData.get('userId'))
      if (!targetId || Number.isNaN(targetId) || targetId <= 0)
        return { error: 'Invalid user ID' }

      await db
        .delete(friendships)
        .where(
          and(
            eq(friendships.status, 'accepted'),
            or(
              and(
                eq(friendships.userId, user.id),
                eq(friendships.friendId, targetId),
              ),
              and(
                eq(friendships.userId, targetId),
                eq(friendships.friendId, user.id),
              ),
            ),
          ),
        )
      return { success: 'Friend removed' }
    }

    return null
  } catch (error) {
    console.error('Error handling friendship action:', error)
    return {
      error: 'An unexpected error occurred while processing your request.',
    }
  }
}

export const clientAction = async ({
  serverAction,
}: Route.ClientActionArgs) => {
  const res = await serverAction()

  if (res?.success) {
    notifications.show({
      title: 'Success!',
      message: res.success,
      autoClose: 5000,
    })
  } else if (res?.error) {
    notifications.show({
      title: 'Error!',
      message: res.error,
      autoClose: 5000,
      color: 'red',
    })
  }
}

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)

  return await ResultAsync.fromPromise(
    db.query.users.findFirst({
      where: {
        id: user.id,
      },
      with: {
        sentFriendships: {
          with: {
            friend: true,
          },
        },
        receivedFriendships: {
          with: {
            user: true,
          },
        },
      },
    }),
    R.identity(),
  )
    .andThen((res) => {
      const acceptedSent =
        res?.sentFriendships
          .filter((f) => f.status === 'accepted')
          .map((f) => f.friend) ?? []

      const acceptedReceived =
        res?.receivedFriendships
          .filter((f) => f.status === 'accepted')
          .map((f) => f.user) ?? []

      const friends = R.uniqueBy(
        [...acceptedSent, ...acceptedReceived],
        (f) => f?.id,
      )

      const pendingRequests =
        res?.receivedFriendships
          .filter((f) => f.status === 'pending')
          .map((f) => f.user) ?? []

      const sentRequests =
        res?.sentFriendships
          .filter((f) => f.status === 'pending')
          .map((f) => f.friend) ?? []

      return ok({
        friends,
        pendingRequests,
        sentRequests,
      })
    })
    .match(R.identity(), (e) => {
      console.error(e)
      throw new Response('Internal Server Error', { status: 500 })
    })
}

export default function FriendsIndex({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit()

  const openRemoveModal = (friendName: string, friendId: number) =>
    openConfirmModal({
      title: 'Remove your friend',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to remove{' '}
          <Text span fw={700} c="blue" inherit>
            {friendName}
          </Text>{' '}
          from your friend list?
        </Text>
      ),
      labels: { confirm: 'Remove', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const formData = new FormData()
        formData.append('userId', friendId.toString())
        formData.append('intent', 'remove-friend')
        submit(formData, { method: 'post' })
      },
    })

  const handleMessageClick = (username: string | undefined) => {
    if (!username) {
      return
    }
    const formData = new FormData()
    formData.append('name', username)
    submit(formData, { method: 'post', action: '/channels/@me' })
  }

  const friends = loaderData?.friends ?? []
  const pendingRequests = loaderData?.pendingRequests ?? []
  const sentRequests = loaderData?.sentRequests ?? []

  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const paginatedFriends = friends.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )
  const totalPages = Math.ceil(friends.length / PAGE_SIZE)

  return (
    <Stack h="100%" gap={0}>
      <Group
        p="md"
        bg="var(--mantine-color-body)"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <IconCookieMan size={25} />
        <Title order={4}>Friends</Title>
      </Group>

      <Tabs
        defaultValue="all"
        h="100%"
        display="flex"
        style={{ flexDirection: 'column' }}
      >
        <Tabs.List px="md">
          <Tabs.Tab value="all">All</Tabs.Tab>
          <Tabs.Tab value="pending">
            Pending
            {pendingRequests.length > 0 && (
              <Badge size="xs" circle ml={5}>
                {pendingRequests.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="add" c="green">
            Add Friend
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" flex={1} p="md">
          <Stack justify="space-between" h="100%">
            <ScrollArea>
              <Stack>
                {friends.length === 0 ? (
                  <Text c="dimmed" ta="center" mt="xl">
                    No friends yet.
                  </Text>
                ) : (
                  paginatedFriends.map((friend) => (
                    <Group
                      key={friend?.id}
                      justify="space-between"
                      p="sm"
                      style={{
                        borderBottom:
                          '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <Group>
                        <Avatar
                          src={null}
                          alt={friend?.name ?? ''}
                          color="initials"
                        >
                          {(friend?.name ?? '').slice(0, 2)}
                        </Avatar>
                        <Text fw={500}>{friend?.name}</Text>
                      </Group>
                      <Group gap="xs">
                        <Tooltip label="Message">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => handleMessageClick(friend?.name)}
                          >
                            <IconMessageCircleFilled size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Remove Friend" color="red">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() =>
                              openRemoveModal(
                                friend?.name ?? '',
                                friend?.id ?? 0,
                              )
                            }
                          >
                            <IconX size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  ))
                )}
              </Stack>
            </ScrollArea>
            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={setPage}
                  withEdges
                />
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="pending" flex={1} p="md">
          <Title order={5} mb="md">
            Pending — {pendingRequests.length}
          </Title>
          <Stack>
            {pendingRequests.map((user) => (
              <Group
                key={user?.id}
                justify="space-between"
                p="sm"
                style={{
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                }}
              >
                <Group>
                  <Avatar src={null} alt={user?.name ?? ''} color="initials">
                    {(user?.name ?? '').slice(0, 2)}
                  </Avatar>
                  <Stack gap={0}>
                    <Text fw={500}>{user?.name}</Text>
                    <Text size="xs" c="dimmed">
                      Incoming Friend Request
                    </Text>
                  </Stack>
                </Group>
                <Form method="post">
                  <input type="hidden" name="userId" value={user?.id} />
                  <Group>
                    <Tooltip label="Accept">
                      <ActionIcon
                        type="submit"
                        name="intent"
                        value="accept-friend-request"
                        variant="filled"
                        color="green"
                        radius="xl"
                      >
                        <IconCheck size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Ignore">
                      <ActionIcon
                        type="submit"
                        name="intent"
                        value="reject-friend-request"
                        variant="filled"
                        color="red"
                        radius="xl"
                      >
                        <IconX size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Form>
              </Group>
            ))}
            {pendingRequests.length === 0 && (
              <Text c="dimmed">There are no pending friend requests.</Text>
            )}
          </Stack>

          {sentRequests.length > 0 && (
            <>
              <Title order={5} mt="xl" mb="md">
                Sent — {sentRequests.length}
              </Title>
              <Stack>
                {sentRequests.map((user) => (
                  <Group
                    key={user?.id}
                    justify="space-between"
                    p="sm"
                    style={{
                      borderBottom:
                        '1px solid var(--mantine-color-default-border)',
                    }}
                  >
                    <Group>
                      <Avatar
                        src={null}
                        alt={user?.name ?? ''}
                        color="initials"
                      >
                        {(user?.name ?? '').slice(0, 2)}
                      </Avatar>
                      <Text fw={500}>{user?.name}</Text>
                    </Group>
                    <Form method="post">
                      <input type="hidden" name="userId" value={user?.id} />
                      <Button
                        type="submit"
                        name="intent"
                        value="cancel-friend-request"
                        variant="outline"
                        color="gray"
                        size="xs"
                      >
                        Cancel Request
                      </Button>
                    </Form>
                  </Group>
                ))}
              </Stack>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="add" flex={1} p="md">
          <Title order={4} mb="sm">
            Add Friend
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            You can add friends with their username.
          </Text>

          <Form method="post">
            <Group align="flex-start">
              <TextInput
                placeholder="Enter username"
                name="username"
                required
                style={{ flex: 1 }}
              />
              <Button type="submit" name="intent" value="send-friend-request">
                Send Friend Request
              </Button>
            </Group>
          </Form>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
