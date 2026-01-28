import { redirect } from 'react-router'
import type { Route } from './+types/_index'
import { authMiddleware } from '../middlewares/auth'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export const loader = async ({ context }: Route.LoaderArgs) => {
  throw redirect('/channels/@me')
}
