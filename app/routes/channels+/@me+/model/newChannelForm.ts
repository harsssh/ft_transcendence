import z from 'zod'

export const NewChannelFormSchema = z.object({
  name: z.string(),
})
