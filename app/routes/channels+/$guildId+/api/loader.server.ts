import { dbContext } from '../../../../contexts/db'
import { loggedInUserContext } from '../../../../contexts/user.server'
import type { Route } from '../+types/route'

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const guildId = Number(params.guildId)

  if (Number.isNaN(guildId)) {
    throw new Response('Invalid Guild ID', { status: 400 })
  }

  const guild = await db.query.guilds.findFirst({
    where: {
      id: guildId,
    },
    with: {
      channels: true,
      roles: true,
    },
  })

  if (!guild) {
    throw new Response('Guild not found', { status: 404 })
  }

  const member = await db.query.guildMembers.findFirst({
    where: {
      guildId: guild.id,
      userId: user.id,
    },
  })
  if (!member) {
    throw new Response('Forbidden: You are not a member of this guild', {
      status: 403,
    })
  }

  const roles = await db.query.usersToRoles.findMany({
    where: {
      userId: user.id,
    },
    with: {
      role: {
        where: {
          guildId: guildId,
        },
      },
    },
  })
  const userPermissions = roles
    .map((r) => r.role)
    .filter((r) => r !== null)
    .reduce((acc, r) => acc | r.permissions, 0)

  return {
    guild,
    loggedInUser: {
      id: user.id,
      name: user.name,
      permissionsMask: userPermissions,
    },
  }
}
