import { parseWithZod } from '@conform-to/zod/v4'
import colors from 'tailwindcss/colors'
import {
  channels,
  guildMembers,
  guilds,
  roles,
  usersToRoles,
} from '../../../../db/schema'
import { dbContext } from '../../../contexts/db'
import { loggedInUserContext } from '../../../contexts/user.server'
import { Permissions } from '../_shared/permissions'
import type { Route } from '../+types/route'
import { NewGuildFormSchema } from '../model/newGuildForm'

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.get(dbContext)
  const user = context.get(loggedInUserContext)

  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()

  const submission = parseWithZod(formData, { schema: NewGuildFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { name } = submission.value

  const newGuildId = await db.transaction(async (tx) => {
    const [newGuild] = await tx
      .insert(guilds)
      .values({
        name,
        ownerId: user.id,
      })
      .returning({ id: guilds.id })

    if (!newGuild) {
      throw new Error(
        `Failed to create guild: insert returned no row for user ${user.id} and name "${name}"`,
      )
    }

    const [adminRole] = await tx
      .insert(roles)
      .values({
        guildId: newGuild.id,
        name: 'admin',
        color: colors.blue[500],
        permissions: Permissions.ADMINISTRATOR,
      })
      .returning({ id: roles.id })
    if (!adminRole) {
      throw new Error(`Failed to create admin role for guild ${newGuild.id}"`)
    }

    const userPermissions =
      Permissions.MANAGE_CHANNELS |
      Permissions.CREATE_INVITE |
      Permissions.SEND_MESSAGES
    await tx.insert(roles).values({
      guildId: newGuild.id,
      name: 'user',
      color: colors.yellow[500],
      permissions: userPermissions,
    })

    const guestPermissions = Permissions.SEND_MESSAGES
    await tx.insert(roles).values({
      guildId: newGuild.id,
      name: 'guest',
      color: colors.neutral[500],
      permissions: guestPermissions,
    })

    await tx.insert(guildMembers).values({
      userId: user.id,
      guildId: newGuild.id,
    })

    await tx.insert(usersToRoles).values({
      userId: user.id,
      roleId: adminRole.id,
    })

    await tx.insert(channels).values({
      name: 'general',
      guildId: newGuild.id,
    })

    return newGuild.id
  })

  return {
    ...submission.reply(),
    guildId: newGuildId.toString(),
  }
}
