import type { SubmissionResult } from '@conform-to/react'
import { ok, ResultAsync } from 'neverthrow'
import { Outlet } from 'react-router'
import * as R from 'remeda'
import { dbContext } from '../../../contexts/db'
import { userContext } from '../../../contexts/user'
import type { ChannelsHandle } from '../_shared/handle'
import type { Route } from './+types/route'
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

export const handle: ChannelsHandle<
  Route.ComponentProps['loaderData'],
  SubmissionResult<string[]> | null
> = {
  navbar: ({ channels }, actionData) => (
    <Navbar channels={channels} lastResult={actionData} />
  ),
  navbarWidth: 300,
}

export default function Me() {
  return <Outlet />
}
