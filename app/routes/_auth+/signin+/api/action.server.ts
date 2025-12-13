import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { users } from '../../../../../db/schema'
import { dbContext } from '../../../../contexts/db'
import { isValidPassword } from '../../_shared/password.server'
import { commitSession, getSession } from '../../_shared/session.server'
import type { Route } from '../+types'
import { SigninFormSchema } from '../model/signinForm'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: SigninFormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const session = await getSession(request)
  const db = context.get(dbContext)

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, submission.value.email))

    if (!user || !isValidPassword(user.password, submission.value.password)) {
      return submission.reply({ formErrors: ['Wrong email or password.'] })
    }

    session.set('userId', user.id)
  } catch (e) {
    console.error(e)
    return submission.reply({
      formErrors: ['Failed to sign in. Try again later.'],
    })
  }

  throw redirect('/channels/@me', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}
