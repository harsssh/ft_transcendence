import z from 'zod'

export const NewChannelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Must be between 1 and 100 in length')
    .max(100, 'Must be between 1 and 100 in length'),
})
