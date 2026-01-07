import { parseWithZod } from '@conform-to/zod'
import { redirect } from 'react-router'
import { dbContext } from '../../../contexts/db'
import { userContext } from '../../../contexts/user'
import { channels, guildMembers, guilds } from '../../../db/schema'
import type { Route } from '../+types/route'
import { NewGuildFormSchema } from '../model/newGuildForm'

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.get(dbContext)
  const user = context.get(userContext)
  const formData = await request.formData()

  const submission = parseWithZod(formData, { schema: NewGuildFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { name } = submission.value

  // Transaction: Create Guild -> Create Member -> Create Default Channel
  const newGuildId = await db.transaction(async (tx) => {
    // 1. Create Guild
    const [newGuild] = await tx
      .insert(guilds)
      .values({
        name,
        ownerId: user.id,
      })
      .returning({ id: guilds.id })

    if (!newGuild) throw new Error('Failed to create guild')

    // 2. Add Owner as Member
    await tx.insert(guildMembers).values({
      userId: user.id,
      guildId: newGuild.id,
    })

    // 3. Create Default Channel
    await tx.insert(channels).values({
      name: 'general',
      guildId: newGuild.id,
    })

    return newGuild.id
  })

  return redirect(`/channels/${newGuildId}`)
}
