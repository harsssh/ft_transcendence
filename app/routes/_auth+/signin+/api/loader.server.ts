import { redirect } from 'react-router'
import { getSession } from '../../_shared/session.server'
import type { Route } from '../+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await getSession(request)

  if (session.has('userId')) {
    throw redirect('/channels/@me')
  }
}
