import z from 'zod'

export const EditProfileSchema = z.object({
  intent: z.literal('edit-profile'),
  displayName: z.string().max(40).optional(),
})
