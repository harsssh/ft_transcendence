import { parseWithZod } from '@conform-to/zod/v4'
import { and, eq, sql } from 'drizzle-orm'
import { err, ok, ResultAsync } from 'neverthrow'
import { useEffect } from 'react'
import { Outlet, useOutletContext } from 'react-router'
import * as R from 'remeda'
import { channels, usersToChannels } from '../../../../db/schema'
import { dbContext } from '../../../contexts/db'
import { loggedInUserContext } from '../../../contexts/user.server'
import type { ChannelsOutletContext } from '../route'
import type { Route } from './+types/route'
import { NewChannelFormSchema } from './model/newChannelForm'
import { Navbar } from './ui/Navbar'

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
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: NewChannelFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const db = context.get(dbContext)

  const res = await db.transaction(async (tx) => {
    const partner = await tx.query.users.findFirst({
      where: { name: submission.value.name },
    })
    if (!partner) {
      return err(
        submission.reply({
          formErrors: ['User not found'],
        }),
      )
    }
    if (partner.id === user.id) {
      return err(
        submission.reply({
          formErrors: ['You cannot create a channel just for yourself.'],
        }),
      )
    }

    const [channel] = await tx
      .select({ id: usersToChannels.channelId })
      .from(usersToChannels)
      .groupBy(usersToChannels.channelId)
      .having(
        and(
          eq(sql`count(*)`, 2),
          sql`bool_and(${usersToChannels.userId} IN (${user.id}, ${partner.id}))`,
        ),
      )
      .limit(1)

    if (channel) {
      return ok(channel)
    }

    const [newChannel] = await tx.insert(channels).values({}).returning()
    if (!newChannel) {
      return err(
        submission.reply({
          formErrors: ['Failed to create channel'],
        }),
      )
    }
    await tx.insert(usersToChannels).values([
      { userId: user.id, channelId: newChannel.id },
      { userId: partner.id, channelId: newChannel.id },
    ])
    return ok(newChannel)
  })

  return res.match(
    (ch) => ({
      ...submission.reply(),
      channelId: ch.id,
    }),
    R.identity(),
  )
}

export default function Me({ loaderData, actionData }: Route.ComponentProps) {
  const channelsContext = useOutletContext<ChannelsOutletContext>()
  const { setSecondaryNavbar } = channelsContext

  useEffect(() => {
    setSecondaryNavbar(
      <Navbar channels={loaderData.channels} lastResult={actionData ?? null} />,
    )

    return () => {
      setSecondaryNavbar(null)
    }
  }, [loaderData.channels, actionData, setSecondaryNavbar])

  return <Outlet context={channelsContext} />
}
