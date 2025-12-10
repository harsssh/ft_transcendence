import { createHash } from 'crypto'
import { usersTable } from 'db/schema'
import { createCookie, redirect } from 'react-router'
import { dbContext } from '~/contexts/db'
import { SignupFormSchema } from '../model/signupForm'
import { DatabaseError } from 'pg'
import { parseWithZod } from '@conform-to/zod/v4'
import { DrizzleQueryError } from 'drizzle-orm'
import type { Route } from '../+types/route'

const authCookie = createCookie('ft_auth', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
})

const hashPassword = (password: string) =>
  createHash('sha256').update(password).digest('hex')

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SignupFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const db = context.get(dbContext)

  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        name: submission.value.name,
        email: submission.value.email,
        password: hashPassword(submission.value.password),
      })
      .returning()

    const cookieHeader = await authCookie.serialize({ userId: user.id })
    return redirect('/channels/@me', {
      headers: {
        'Set-Cookie': cookieHeader,
      },
    })
  } catch (e) {
    if (e instanceof DrizzleQueryError && e.cause instanceof DatabaseError) {
      // ユーザー重複時
      if (e.cause.code === '23505') {
        console.log('conflict')
        return submission.reply({
          fieldErrors: { email: ['This email address is already in use.'] },
        })
      }
    }
    return submission.reply({
      formErrors: ['Failed to create an account. Try again later.'],
    })
  }
}
