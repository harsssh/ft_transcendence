import { parseWithZod } from '@conform-to/zod/v4'
import { ok, ResultAsync } from 'neverthrow'
import { useEffect } from 'react'
import { Outlet, useOutletContext } from 'react-router'
import * as R from 'remeda'
import { channels, usersToChannels } from '../../../../db/schema'
import { dbContext } from '../../../contexts/db'
import { userContext } from '../../../contexts/user'
import type { ChannelsOutletContext } from '../route'
import type { Route } from './+types/route'
import { NewChannelFormSchema } from './model/newChannelForm'
import { Navbar } from './ui/Navbar'

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext)
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
        channels: {
          with: {
            participants: true,
          },
        },
      },
    }),
    R.identity(),
  )
    .andThen((res) => {
      return ok({
        channels:
          res?.channels.map((ch) => ({
            id: ch.id,
            name: ch.name ?? ch.participants.map((p) => p.name).join(', '),
            participants: ch.participants.map((p) => ({
              userId: p.id,
              name: p.name,
            })),
          })) ?? [],
      })
    })
    .match(R.identity(), (e) => {
      console.error(e)
      throw new Response('Internal Server Error', { status: 500 })
    })
}

export const action = async ({ context, request }: Route.ActionArgs) => {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: NewChannelFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const db = context.get(dbContext)
  const participant = await db.query.users.findFirst({
    where: { name: submission.value.name },
  })
  if (!participant) {
    return submission.reply({
      formErrors: ['User not found'],
    })
  }
  if (participant.id === user.id) {
    return submission.reply({
      formErrors: ['You cannot create a channel just for yourself.'],
    })
  }

  const [channel] = await db.transaction(async (tx) => {
    const [newChannel] = await tx.insert(channels).values({}).returning()
    if (!newChannel) {
      throw new Error('Failed to create channel')
    }
    await tx.insert(usersToChannels).values([
      { userId: user.id, channelId: newChannel.id },
      { userId: participant.id, channelId: newChannel.id },
    ])
    return [newChannel]
  })

  return {
    ...submission.reply(),
    channelId: channel?.id,
  }
}

export default function Me({ loaderData, actionData }: Route.ComponentProps) {
  const { setSecondaryNavbar, setSecondaryNavbarWidth } =
    useOutletContext<ChannelsOutletContext>()

  useEffect(() => {
    setSecondaryNavbar(
      <Navbar channels={loaderData.channels} lastResult={actionData ?? null} />,
    )
    setSecondaryNavbarWidth(300)

    return () => {
      setSecondaryNavbar(null)
      setSecondaryNavbarWidth(0)
    }
  }, [
    loaderData.channels,
    actionData,
    setSecondaryNavbar,
    setSecondaryNavbarWidth,
  ])

  return <Outlet />
}
