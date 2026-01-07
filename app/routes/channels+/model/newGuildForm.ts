import z from 'zod'

export const NewGuildFormSchema = z.object({
  name: z.string(),
})
