import z from 'zod'

export const AssignRoleSchema = z.object({
  userId: z.coerce.number(),
  roleId: z.coerce.number(),
})
