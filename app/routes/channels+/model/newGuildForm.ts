import z from 'zod/v4'

export const NewGuildFormSchema = z.object({
  name: z.string(),
})
