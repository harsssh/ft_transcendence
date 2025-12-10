import { parseWithZod } from '@conform-to/zod/v4'
import { usersTable } from 'db/schema'
import { DrizzleQueryError } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { redirect } from 'react-router'
import { dbContext } from '~/contexts/db'
import { hashPassword } from '../../_shared/password.server'
import { commitSession, getSession } from '../../_shared/session.server'
import type { Route } from '../+types/route'
import { SignupFormSchema } from '../model/signupForm'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SignupFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const session = await getSession(request.headers.get('Cookie'))
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

    session.set('userId', user.id)

    return redirect('/channels/@me', {
      headers: {
        'Set-Cookie': await commitSession(session),
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
