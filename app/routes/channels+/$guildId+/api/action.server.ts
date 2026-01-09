import { and, eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { guildMembers, guilds } from '../../../../../db/schema'
import { dbContext } from '../../../../contexts/db'
import { userContext } from '../../../../contexts/user'
import type { Route } from '../+types/route'

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'leave-server') {
    const guildId = Number(params.guildId)
    if (!guildId || Number.isNaN(guildId)) {
      return { error: 'Invalid guild ID' }
    }

    try {
      const guild = await db.query.guilds.findFirst({
        where: {
          id: guildId,
        },
      })
      if (!guild) {
        return { error: 'Server not found' }
      }
    } catch (error) {
      console.error('Error handling guild action:', error)
      return {
        error: 'An unexpected error occurred while processing your request.',
      }
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
      return {
        error: 'An unexpected error occurred while processing your request.',
      }
    }

    throw redirect('/channels/@me')
  }

  if (intent === 'delete-server') {
    const guildId = Number(params.guildId)
    if (!guildId || Number.isNaN(guildId)) {
      return { error: 'Invalid guild ID' }
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
        return { error: 'Server not found' }
      }
      if (guild.ownerId !== user.id) {
        return { error: 'Only the server owner can delete the server' }
      }
    } catch (error) {
      console.error('Error handling guild action:', error)
      return {
        error: 'An unexpected error occurred while processing your request.',
      }
    }

    try {
      await db.delete(guilds).where(eq(guilds.id, guildId))
    } catch (error) {
      console.error('Error deleting guild:', error)
      return {
        error: 'An unexpected error occurred while processing your request.',
      }
    }

    throw redirect('/channels/@me')
  }

  return null
}
