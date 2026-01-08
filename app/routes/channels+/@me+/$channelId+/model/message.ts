import z from 'zod'

export const SendMessageSchema = z.object({
  intent: z.literal('send-message'),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
})
