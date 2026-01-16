import z from 'zod'

export const KickMemberSchema = z.object({
  userId: z.coerce.number(),
})
