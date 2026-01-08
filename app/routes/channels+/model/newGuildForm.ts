import z from 'zod'

export const NewGuildFormSchema = z.object({
  name: z
    .string({ required_error: 'Must be between 2 and 100 in length' })
    .trim()
    .min(2, 'Must be between 2 and 100 in length')
    .max(100, 'Must be between 2 and 100 in length'),
})
