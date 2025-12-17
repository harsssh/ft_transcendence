import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconCookieMan, IconX, IconMessageCircleFilled } from '@tabler/icons-react'
import { and, eq, or } from 'drizzle-orm'
import { Form, useRouteLoaderData } from 'react-router'
import { friendships } from '../../../../db/schema'
import { dbContext } from '../../../contexts/db'
import { userContext } from '../../../contexts/user'
import type { Route } from './+types/_index'
import type { loader } from './route'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const formData = await request.formData()
  const intent = formData.get('intent')

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

    const existing = await db.query.friendships.findFirst({
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
        return { error: 'Friend request already pending' }
      } else if (existing.status === 'accepted') {
        return { error: 'Already friends' }
      }
    }

    await db.insert(friendships).values({
      userId: user.id,
      friendId: targetUser.id,
      status: 'pending',
    })

    return { success: true }
  }

  if (intent === 'accept-friend-request') {
    const targetId = Number(formData.get('userId'))
    if (!targetId) return { error: 'Invalid user ID' }

    await db
      .update(friendships)
      .set({ status: 'accepted' })
      .where(
        and(
          eq(friendships.userId, targetId),
          eq(friendships.friendId, user.id),
          eq(friendships.status, 'pending'),
        ),
      )

    return { success: true }
  }

  if (
    intent === 'reject-friend-request' ||
    intent === 'cancel-friend-request'
  ) {
    const targetId = Number(formData.get('userId'))
    if (!targetId) return { error: 'Invalid user ID' }

    await db
      .delete(friendships)
      .where(
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
      )

    return { success: true }
  }

  if (intent === 'remove-friend') {
    const targetId = Number(formData.get('userId'))
    if (!targetId) return { error: 'Invalid user ID' }

    await db
      .delete(friendships)
      .where(
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
      )
    return { success: true }
  }

  return null
}

export const clientAction = async ({
  serverAction,
}: Route.ClientActionArgs) => {
  const res = await serverAction()

  if (res?.success) {
    console.log('request success')
    notifications.show({
      title: 'Success!',
      message: 'Sent a friend request',
      autoClose: 5000,
    })
  } else if (res?.error) {
    console.log('request error:', res.error)
    notifications.show({
      title: 'Error!',
      message: res.error,
      autoClose: 5000,
      color: 'red',
    })
  }
}

export default function FriendsIndex() {
  const data = useRouteLoaderData<typeof loader>('routes/channels+/@me+/route')

  const friends = data?.friends ?? []
  const pendingRequests = data?.pendingRequests ?? []
  const sentRequests = data?.sentRequests ?? []

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
          <Stack>
            {friends.length === 0 ? (
              <Text c="dimmed" ta="center" mt="xl">
                No friends yet.
              </Text>
            ) : (
              friends.map((friend) => (
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
                    <ActionIcon variant="subtle" color="gray" title="Message">
                      {/* TODO: Link to DM */}
                      <IconMessageCircleFilled size={18} />
                    </ActionIcon>
                    <Form method="post">
                      <input type="hidden" name="userId" value={friend?.id} />
                      <Tooltip label="Remove Friend">
                        <ActionIcon
                          type="submit"
                          name="intent"
                          value="remove-friend"
                          variant="subtle"
                          color="red"
                        >
                          <IconX size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Form>
                  </Group>
                </Group>
              ))
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
                placeholder="You can add friends with their username."
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
