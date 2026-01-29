import { z } from 'zod'

export const SignupFormSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Name is required.' : issue.message,
    })
    .max(255),
  email: z
    .email({
      error: (issue) =>
        issue.input === undefined ? 'Email is required.' : issue.message,
    })
    .max(255),
  password: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Password is required.' : issue.message,
    })
    .min(8)
    .max(16),
})
