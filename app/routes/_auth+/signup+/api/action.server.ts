import { parseWithZod } from '@conform-to/zod/v4'
import { usersTable } from 'db/schema'
import { DrizzleQueryError } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { redirect } from 'react-router'
import { hashPassword } from '../../_shared/password.server'
import { commitSession, getSession } from '../../_shared/session.server'
import type { Route } from '../+types/route'
import { SignupFormSchema } from '../model/signupForm'
import { dbContext } from 'app/contexts/db'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SignupFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const session = await getSession(request)
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

    if (!user) {
      return submission.reply({
        formErrors: ['Failed to create an account. Try again later.'],
      })
    }

    session.set('userId', user.id)
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

  throw redirect('/channels/@me', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}
