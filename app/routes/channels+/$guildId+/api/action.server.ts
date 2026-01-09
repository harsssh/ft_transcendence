import { parseWithZod } from '@conform-to/zod/v4'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { guildMembers, guilds } from '../../../../../db/schema'
import { dbContext } from '../../../../contexts/db'
import { userContext } from '../../../../contexts/user'
import { SignupFormSchema } from '../../../_auth+/signup+/model/signupForm'
import { NewGuildFormSchema } from '../../model/newGuildForm'
import type { Route } from '../+types/route'

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'invite-friend') {
    const guildId = Number(params.guildId)
    if (!guildId || Number.isNaN(guildId)) {
      throw new Response('Invalid guild ID', { status: 400 })
    }

    const currentUserMember = await db.query.guildMembers.findFirst({
      where: {
        userId: user.id,
        guildId: guildId,
      },
    })
    if (!currentUserMember) {
      throw new Response('Only the server member can invite a friend', {
        status: 403,
      })
    }

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

    try {
      await db.insert(guildMembers).values({
        userId: targetUser.id,
        guildId: guildId,
      })
    } catch (error) {
      console.error('Error inviting user:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    return submission.reply()
  }

  if (intent === 'rename-server') {
    const guildId = Number(params.guildId)
    if (!guildId || Number.isNaN(guildId)) {
      throw new Response('Invalid guild ID', { status: 400 })
    }

    const submission = parseWithZod(formData, { schema: NewGuildFormSchema })
    if (submission.status !== 'success') {
      return submission.reply()
    }
    const { name } = submission.value

    try {
      const guild = await db.query.guilds.findFirst({
        where: {
          id: guildId,
        },
        columns: {
          ownerId: true,
        },
      })
      if (!guild) {
        throw new Response('Server not found', { status: 404 })
      }
      if (guild.ownerId !== user.id) {
        throw new Response('Only the server owner can rename the server', {
          status: 403,
        })
      }
    } catch (error) {
      if (error instanceof Response) throw error
      console.error('Error handling guild action:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    try {
      await db.update(guilds).set({ name }).where(eq(guilds.id, guildId))
    } catch (error) {
      console.error('Error renaming guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }
    return submission.reply()
  }

  if (intent === 'leave-server') {
    const guildId = Number(params.guildId)
    if (!guildId || Number.isNaN(guildId)) {
      throw new Response('Invalid guild ID', { status: 400 })
    }

    try {
      const guild = await db.query.guilds.findFirst({
        where: {
          id: guildId,
        },
      })
      if (!guild) {
        throw new Response('Server not found', { status: 404 })
      }
    } catch (error) {
      if (error instanceof Response) throw error
      console.error('Error handling guild action:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }
    try {
      await db
        .delete(guildMembers)
        .where(
          and(
            eq(guildMembers.userId, user.id),
            eq(guildMembers.guildId, guildId),
          ),
        )
    } catch (error) {
      console.error('Error leaving guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    throw redirect('/channels/@me')
  }

  if (intent === 'delete-server') {
    const guildId = Number(params.guildId)
    if (!guildId || Number.isNaN(guildId)) {
      throw new Response('Invalid guild ID', { status: 400 })
    }

    try {
      const guild = await db.query.guilds.findFirst({
        where: {
          id: guildId,
        },
        columns: {
          ownerId: true,
        },
      })
      if (!guild) {
        throw new Response('Server not found', { status: 404 })
      }
      if (guild.ownerId !== user.id) {
        throw new Response('Only the server owner can delete the server', {
          status: 403,
        })
      }
    } catch (error) {
      if (error instanceof Response) throw error
      console.error('Error handling guild action:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    try {
      await db.delete(guilds).where(eq(guilds.id, guildId))
    } catch (error) {
      console.error('Error deleting guild:', error)
      throw new Response(
        'An unexpected error occurred while processing your request.',
        { status: 500 },
      )
    }

    throw redirect('/channels/@me')
  }

  return null
}
