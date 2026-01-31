import { parseWithZod } from '@conform-to/zod/v4'
import { and, eq, inArray } from 'drizzle-orm'
import { redirect } from 'react-router'
import {
  channels,
  guildMembers,
  guilds,
  usersToRoles,
} from '../../../../../db/schema'
import { dbContext } from '../../../../contexts/db'
import { loggedInUserContext } from '../../../../contexts/user.server'
import { SignupFormSchema } from '../../../_auth+/signup+/model/signupForm'
import { hasPermission, Permissions } from '../../_shared/permissions'
import { AssignRoleSchema } from '../../model/assignRoleForm'
import { KickMemberSchema } from '../../model/kickMemberForm'
import { NewGuildFormSchema } from '../../model/newGuildForm'
import type { Route } from '../+types/route'
import { NewChannelFormSchema } from '../model/newChannelForm'

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const guildId = Number(params.guildId)
  if (!guildId || Number.isNaN(guildId)) {
    throw new Response('Invalid guild ID', { status: 400 })
  }

  const db = context.get(dbContext)
  const formData = await request.formData()
  const intent = formData.get('intent')

  const guild = await db.query.guilds
    .findFirst({
      where: {
        id: guildId,
      },
      columns: {
        ownerId: true,
      },
    })
    .catch((error) => {
      if (error instanceof Response) throw error
      console.log('Error handling guild action:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    })
  if (!guild) {
    throw new Response('Server not found', { status: 404 })
  }

  const currentUserMember = await db.query.guildMembers.findFirst({
    where: {
      userId: user.id,
      guildId: guildId,
    },
  })
  if (!currentUserMember) {
    throw new Response('Only the server member can perform this action', {
      status: 403,
    })
  }

  const userWithRoles = await db.query.users.findFirst({
    where: {
      id: user.id,
    },
    with: {
      roles: {
        where: {
          guildId: guildId,
        },
      },
    },
  })
  const userPermissions =
    userWithRoles?.roles.reduce((acc, r) => acc | r.permissions, 0) ?? 0

  const checkPermission = (requiredPermission: number) => {
    if (!hasPermission(userPermissions, requiredPermission)) {
      throw new Response('Forbidden: Insufficient permissions', { status: 403 })
    }
  }

  const isOwner = guild.ownerId === user.id

  if (intent === 'invite-friend') {
    checkPermission(Permissions.CREATE_INVITE)

    const InviteFriendSchema = SignupFormSchema.pick({ name: true })
    const submission = parseWithZod(formData, { schema: InviteFriendSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { name: username } = submission.value

    const targetUser = await db.query.users.findFirst({
      where: {
        name: username,
      },
    })

    if (!targetUser) {
      return submission.reply({
        formErrors: ['User not found'],
      })
    }

    const existingMember = await db.query.guildMembers.findFirst({
      where: {
        userId: targetUser.id,
        guildId: guildId,
      },
    })

    if (existingMember) {
      return submission.reply({
        formErrors: ['User is already a member of this server'],
      })
    }

    const defaultUserRole = await db.query.roles.findFirst({
      where: {
        guildId: guildId,
        name: 'user',
      },
    })

    if (!defaultUserRole) {
      return submission.reply({
        formErrors: ['User role not found in this guild'],
      })
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(guildMembers).values({
          userId: targetUser.id,
          guildId: guildId,
        })
        await tx.insert(usersToRoles).values({
          userId: targetUser.id,
          roleId: defaultUserRole.id,
        })
      })
    } catch (error) {
      console.log('Error inviting user:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    return submission.reply()
  }

  if (intent === 'rename-server') {
    checkPermission(Permissions.MANAGE_GUILD)

    const submission = parseWithZod(formData, { schema: NewGuildFormSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { name } = submission.value

    try {
      await db.update(guilds).set({ name }).where(eq(guilds.id, guildId))
    } catch (error) {
      console.log('Error renaming guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }
    return submission.reply()
  }

  if (intent === 'create-channel') {
    checkPermission(Permissions.MANAGE_CHANNELS)

    const submission = parseWithZod(formData, { schema: NewChannelFormSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { name } = submission.value

    try {
      const [_newChannel] = await db
        .insert(channels)
        .values({
          name: name,
          guildId: guildId,
        })
        .returning()

      // TODO:
      // throw redirect(`/channels/${guildId}/${newChannel?.id}`)
    } catch (error) {
      if (error instanceof Response) throw error
      console.log('Error creating channel in guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }
    return submission.reply()
  }

  if (intent === 'rename-channel') {
    checkPermission(Permissions.MANAGE_CHANNELS)

    const channelId = Number(formData.get('channelId'))
    if (!channelId || Number.isNaN(channelId)) {
      throw new Response('Invalid channel ID', { status: 400 })
    }

    const submission = parseWithZod(formData, { schema: NewChannelFormSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { name } = submission.value

    try {
      await db.update(channels).set({ name }).where(eq(channels.id, channelId))
    } catch (error) {
      console.log('Error renaming channel:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }
    return submission.reply()
  }

  if (intent === 'delete-channel') {
    checkPermission(Permissions.MANAGE_CHANNELS)

    const channelId = Number(formData.get('channelId'))
    if (!channelId || Number.isNaN(channelId)) {
      throw new Response('Invalid channel ID', { status: 400 })
    }

    try {
      await db.delete(channels).where(eq(channels.id, channelId))
    } catch (error) {
      console.log('Error deleting channel:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    throw redirect(`/channels/${guildId}`)
  }

  if (intent === 'leave-server') {
    if (isOwner) {
      throw new Response('The server owner cannot leave the server', {
        status: 403,
      })
    }

    try {
      await db.transaction(async (tx) => {
        const guildRoles = await tx.query.roles.findMany({
          where: {
            guildId: guildId,
          },
          columns: {
            id: true,
          },
        })
        const guildRoleIds = guildRoles.map((r) => r.id)
        if (guildRoleIds.length > 0) {
          await tx
            .delete(usersToRoles)
            .where(
              and(
                eq(usersToRoles.userId, user.id),
                inArray(usersToRoles.roleId, guildRoleIds),
              ),
            )
        }

        await tx
          .delete(guildMembers)
          .where(
            and(
              eq(guildMembers.userId, user.id),
              eq(guildMembers.guildId, guildId),
            ),
          )
      })
    } catch (error) {
      console.log('Error leaving guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    throw redirect('/channels/@me')
  }

  if (intent === 'delete-server') {
    if (!isOwner) {
      throw new Response('Only the server owner can delete the server', {
        status: 403,
      })
    }

    try {
      await db.delete(guilds).where(eq(guilds.id, guildId))
    } catch (error) {
      console.log('Error deleting guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    throw redirect('/channels/@me')
  }

  if (intent === 'kick-member') {
    checkPermission(Permissions.KICK_MEMBERS)

    const submission = parseWithZod(formData, { schema: KickMemberSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { userId: targetUserId } = submission.value

    if (guild.ownerId === targetUserId) {
      return submission.reply({
        formErrors: ['Cannot kick the server owner'],
      })
    }

    if (user.id === targetUserId) {
      return submission.reply({
        formErrors: ['Cannot kick yourself'],
      })
    }

    const existingMember = await db.query.guildMembers.findFirst({
      where: {
        userId: targetUserId,
        guildId: guildId,
      },
    })

    if (!existingMember) {
      return submission.reply({
        formErrors: ['User is not a member of this server'],
      })
    }

    try {
      await db.transaction(async (tx) => {
        const guildRoles = await tx.query.roles.findMany({
          where: {
            guildId: guildId,
          },
          columns: {
            id: true,
          },
        })
        const guildRoleIds = guildRoles.map((r) => r.id)
        if (guildRoleIds.length > 0) {
          await tx
            .delete(usersToRoles)
            .where(
              and(
                eq(usersToRoles.userId, targetUserId),
                inArray(usersToRoles.roleId, guildRoleIds),
              ),
            )
        }

        await tx
          .delete(guildMembers)
          .where(
            and(
              eq(guildMembers.userId, targetUserId),
              eq(guildMembers.guildId, guildId),
            ),
          )
      })
    } catch (error) {
      console.log('Error kicking member:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    return submission.reply()
  }

  if (intent === 'assign-role') {
    const submission = parseWithZod(formData, { schema: AssignRoleSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { userId: targetUserId, roleId: targetRoleId } = submission.value

    if (!isOwner) {
      checkPermission(Permissions.MANAGE_ROLES)
    }

    if (!isOwner && guild.ownerId === targetUserId) {
      return submission.reply({
        formErrors: ['Cannot manage roles of the server owner'],
      })
    }

    const existingMember = await db.query.guildMembers.findFirst({
      where: {
        userId: targetUserId,
        guildId: guildId,
      },
    })

    if (!existingMember) {
      return submission.reply({
        formErrors: ['User is not a member of this server'],
      })
    }

    const targetRole = await db.query.roles.findFirst({
      where: {
        id: targetRoleId,
        guildId: guildId,
      },
    })

    if (!targetRole) {
      return submission.reply({
        formErrors: ['Role not found in this guild'],
      })
    }

    if (!isOwner) {
      const missingPermissions = targetRole.permissions & ~userPermissions
      const hasAdmin = hasPermission(userPermissions, Permissions.ADMINISTRATOR)
      if (missingPermissions !== 0 && !hasAdmin) {
        return submission.reply({
          formErrors: [
            'You cannot assign a role with permissions you do not possess',
          ],
        })
      }
    }

    try {
      await db
        .insert(usersToRoles)
        .values({
          userId: targetUserId,
          roleId: targetRoleId,
        })
        .onConflictDoNothing()
    } catch (error) {
      console.log('Error assigning role:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    return submission.reply()
  }

  if (intent === 'remove-role') {
    const submission = parseWithZod(formData, { schema: AssignRoleSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { userId: targetUserId, roleId: targetRoleId } = submission.value

    if (!isOwner) {
      checkPermission(Permissions.MANAGE_ROLES)
    }

    if (!isOwner && guild.ownerId === targetUserId) {
      return submission.reply({
        formErrors: ['Cannot manage roles of the server owner'],
      })
    }

    const existingMember = await db.query.guildMembers.findFirst({
      where: {
        userId: targetUserId,
        guildId: guildId,
      },
    })

    if (!existingMember) {
      return submission.reply({
        formErrors: ['User is not a member of this server'],
      })
    }

    const targetRole = await db.query.roles.findFirst({
      where: {
        id: targetRoleId,
        guildId: guildId,
      },
    })

    if (!targetRole) {
      return submission.reply({
        formErrors: ['Role not found in this guild'],
      })
    }

    if (!isOwner) {
      const missingPermissions = targetRole.permissions & ~userPermissions
      const hasAdmin = hasPermission(userPermissions, Permissions.ADMINISTRATOR)
      if (missingPermissions !== 0 && !hasAdmin) {
        return submission.reply({
          formErrors: [
            'You cannot remove a role with permissions you do not possess',
          ],
        })
      }
    }

    try {
      await db
        .delete(usersToRoles)
        .where(
          and(
            eq(usersToRoles.userId, targetUserId),
            eq(usersToRoles.roleId, targetRoleId),
          ),
        )
    } catch (error) {
      console.log('Error removing role:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    return submission.reply()
  }

  return null
}
