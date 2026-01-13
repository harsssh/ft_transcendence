import { PutObjectCommand } from '@aws-sdk/client-s3'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'
import { users } from '../../../../../../db/schema'
import { dbContext } from '../../../../../contexts/db'
import { AVATAR_BUCKET, storageContext } from '../../../../../contexts/storage'
import { loggedInUserContext } from '../../../../../contexts/user.server'
import { EditProfileSchema } from '../../../_text/model/profile'
import type { Route } from '../+types/route'

export const action = async ({ context, request }: Route.ActionArgs) => {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()

  const submission = parseWithZod(formData, {
    schema: EditProfileSchema,
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

      avatarUrl = `${AVATAR_BUCKET}/${fileName}`
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

  throw new Response('Bad Request', { status: 400 })
}
