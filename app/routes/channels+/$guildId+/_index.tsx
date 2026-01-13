import { redirect } from 'react-router'
import { dbContext } from '../../../contexts/db'
import type { Route } from './+types/_index'

export const loader = async ({ context, params }: Route.LoaderArgs) => {
  const db = context.get(dbContext)
  const guildId = Number(params.guildId)

  if (Number.isNaN(guildId)) {
    throw new Response('Bad Request', { status: 400 })
  }

  const firstChannel = await db.query.channels.findFirst({
    where: {
      guildId: guildId,
    },
    columns: {
      id: true,
    },
  })

  if (firstChannel) {
    return redirect(`/channels/${guildId}/${firstChannel.id}`)
  }

  return null
}

export default function GuildIndex() {
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      No channels found. Please create a channel.
    </div>
  )
}
