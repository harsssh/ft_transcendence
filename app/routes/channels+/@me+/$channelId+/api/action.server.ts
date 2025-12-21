import { parseWithZod } from '@conform-to/zod/v4'
import z from 'zod'
import { messages } from '../../../../../../db/schema'
import { dbContext } from '../../../../../contexts/db'
import { userContext } from '../../../../../contexts/user'
import type { Route } from '../+types/route'
import { SendMessageSchema } from '../model/message'

export const action = async ({
  context,
  request,
  params,
}: Route.ActionArgs) => {
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SendMessageSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const db = context.get(dbContext)
  const { data: channelId, success: isValidChannelId } = z.coerce
    .number()
    .safeParse(params.channelId)

  if (!isValidChannelId) {
    throw new Response('Channel not found', { status: 404 })
  }

  const channel = await db.query.channels.findFirst({
    where: {
      id: channelId,
    },
    with: {
      participants: true,
    },
  })

  if (!channel) {
    throw new Response('Channel not found', { status: 404 })
  }

  if (!channel.participants.some((p) => p.id === user.id)) {
    throw new Response('Forbidden', { status: 403 })
  }

  await db.insert(messages).values({
    content: submission.value.content,
    channelId,
    senderId: user.id,
  })

  return submission.reply({
    resetForm: true,
    fieldErrors: {},
  })
}
