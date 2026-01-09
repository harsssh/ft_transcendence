import { parseWithZod } from '@conform-to/zod/v4'
import { channels, guildMembers, guilds } from '../../../../db/schema'
import { dbContext } from '../../../contexts/db'
import { userContext } from '../../../contexts/user'
import type { Route } from '../+types/route'
import { NewGuildFormSchema } from '../model/newGuildForm'

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.get(dbContext)
  const user = context.get(userContext)

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

    await tx.insert(guildMembers).values({
      userId: user.id,
      guildId: newGuild.id,
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
