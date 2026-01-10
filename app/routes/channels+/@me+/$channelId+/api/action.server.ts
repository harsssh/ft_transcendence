import { PutObjectCommand } from '@aws-sdk/client-s3'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { messages, users } from '../../../../../../db/schema'
import { dbContext } from '../../../../../contexts/db'
import {
  AVATAR_BUCKET,
  MINIO_PUBLIC_ENDPOINT,
  storageContext,
} from '../../../../../contexts/storage'
import { loggedInUserContext } from '../../../../../contexts/user.server'
import type { Route } from '../+types/route'
import { SendMessageSchema } from '../model/message'
import { EditProfileSchema } from '../model/profile'

export const action = async ({
  context,
  request,
  params,
}: Route.ActionArgs) => {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()

  const submission = parseWithZod(formData, {
    schema: z.discriminatedUnion('intent', [
      SendMessageSchema,
      EditProfileSchema,
    ]),
  })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  if (submission.value.intent === 'edit-profile') {
    const db = context.get(dbContext)
    const s3Client = context.get(storageContext)

    let avatarUrl: string | null = null

    if (submission.value.avatarImage) {
      const file = submission.value.avatarImage
      const fileExtension = file.name.split('.').pop() || 'png'
      const fileName = `${user.id}-${Date.now()}.${fileExtension}`
      const fileBuffer = await file.arrayBuffer()

      await s3Client.send(
        new PutObjectCommand({
          Bucket: AVATAR_BUCKET,
          Key: fileName,
          Body: Buffer.from(fileBuffer),
          ContentType: file.type,
        }),
      )

      avatarUrl = `${MINIO_PUBLIC_ENDPOINT}/${AVATAR_BUCKET}/${fileName}`
    }

    await db
      .update(users)
      .set({
        displayName: submission.value.displayName ?? null,
        ...(avatarUrl && { avatarUrl }),
      })
      .where(eq(users.id, user.id))

    return submission.reply()
  }

  if (submission.value.intent === 'send-message') {
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

  throw new Response('Bad Request', { status: 400 })
}
