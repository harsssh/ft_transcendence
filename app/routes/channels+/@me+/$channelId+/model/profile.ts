import z from 'zod'

const IMAGE_FILE_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB

export const EditProfileSchema = z.object({
  intent: z.literal('edit-profile'),
  displayName: z.string().max(40).optional(),
  avatarImage: z
    .instanceof(File)
    .refine((file) => file.size <= IMAGE_FILE_SIZE_LIMIT, {
      message: 'Image size must be less than 5MB',
    })
    .transform((file) => (file.size === 0 ? null : file))
    .refine((file) => file?.type.startsWith('image/') ?? true, {
      message: 'File must be an image',
    })
    .optional(),
})
