import { type ActionFunctionArgs, redirect } from 'react-router'
import { destroySession, getSession } from './_shared/session.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request)
  return redirect('/signin', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}

export const loader = async () => {
  return redirect('/signin')
}
