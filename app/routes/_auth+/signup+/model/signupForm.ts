import { z } from 'zod'

export const SignupFormSchema = z.object({
  name: z.string().max(255),
  email: z.email().max(255),
  password: z.string().min(8).max(16),
})
