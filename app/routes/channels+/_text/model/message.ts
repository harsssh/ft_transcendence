import z from 'zod'

export const MessageSchema = z.object({
  id: z.coerce.number(),
  content: z.string(),
  createdAt: z.coerce.date(),
  sender: z.object({
    id: z.coerce.number(),
    name: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  asset3D: z.object({
    status: z.string(),
    modelUrl: z.string().nullable(),
    // [3D Refine] Added mode property to schema
    mode: z.string().optional(),
  }).nullable().optional(),
})

export type MessageType = z.infer<typeof MessageSchema>

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
})
