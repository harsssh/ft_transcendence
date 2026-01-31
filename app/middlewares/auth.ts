import { eq } from 'drizzle-orm'
import { type MiddlewareFunction, redirect } from 'react-router'
import { users } from '../../db/schema'
import { dbContext } from '../contexts/db'
import {
  resolveStoragePublicEndpoint,
  STORAGE_PUBLIC_ENDPOINT,
} from '../contexts/storage'
import { loggedInUserContext } from '../contexts/user.server'
import {
  destroySession,
  getSession,
} from '../routes/_auth+/_shared/session.server'

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
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) {
      return redirect('/signin', {
        headers: {
          'Set-Cookie': await destroySession(session),
        },
      })
    }
    context.set(loggedInUserContext, {
      ...user,
      avatarUrl: user.avatarUrl
        ? `${resolveStoragePublicEndpoint(request)}/${user.avatarUrl}`
        : null,
    })
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
