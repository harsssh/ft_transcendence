import { parseWithZod } from '@conform-to/zod/v4'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { guildMembers, guilds } from '../../../../../db/schema'
import { dbContext } from '../../../../contexts/db'
import { userContext } from '../../../../contexts/user'
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
