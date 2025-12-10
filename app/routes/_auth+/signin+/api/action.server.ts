import { parseWithZod } from '@conform-to/zod/v4'
import { usersTable } from 'db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { isValidPassword } from '../../_shared/password.server'
import { commitSession, getSession } from '../../_shared/session.server'
import type { Route } from '../+types/route'
import { SigninFormSchema } from '../model/signinForm'
import { dbContext } from 'app/contexts/db'

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
      .from(usersTable)
      .where(eq(usersTable.email, submission.value.email))

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
