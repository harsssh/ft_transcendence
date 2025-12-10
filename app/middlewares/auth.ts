import { dbContext } from 'app/contexts/db'
import { userContext } from 'app/contexts/user'
import {
  destroySession,
  getSession,
} from 'app/routes/_auth+/_shared/session.server'
import { usersTable } from 'db/schema'
import { eq } from 'drizzle-orm'
import { redirect, type MiddlewareFunction } from 'react-router'

export const authMiddleware: MiddlewareFunction<Response> = async ({
  request,
  context,
}) => {
  const session = await getSession(request)
  const userId = session.get('userId')

  if (!userId) {
    return redirect('/signin')
  }

  try {
    const db = context.get(dbContext)
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
    if (!user) {
      return redirect('/signin', {
        headers: {
          'Set-Cookie': await destroySession(session),
        },
      })
    }
    context.set(userContext, user)
  } catch (e) {
    console.error(e)
    return redirect('/signin', {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    })
  }

  return
}
