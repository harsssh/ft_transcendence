import z from 'zod'

export const SigninFormSchema = z.object({
  email: z.email(),
  password: z.string(),
})
