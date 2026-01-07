import { dbContext } from '../../../../contexts/db'
import { userContext } from '../../../../contexts/user'

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const db = context.get(dbContext)
  const user = context.get(userContext)
  const guildId = Number(params.guildId)

  const guild = await db.query.guilds.findFirst({
    where: (g, { eq }) => eq(g.id, guildId),
    with: {
      channels: true,
    },
  })

  if (!guild) {
    throw new Response('Guild not found', { status: 404 })
  }

  // Check membership (optional but recommended)
  // ...

  return { guild }
}

