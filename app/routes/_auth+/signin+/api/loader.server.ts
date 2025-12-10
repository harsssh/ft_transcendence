import { redirect } from 'react-router'
import { getSession } from '../../_shared/session.server'
import type { Route } from '../+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await getSession(request.headers.get('Cookie'))

  if (session.has('userId')) {
    return redirect('/channels/@me')
  }
}
