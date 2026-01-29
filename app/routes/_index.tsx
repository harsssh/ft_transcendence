import { redirect } from 'react-router'
import { authMiddleware } from '../middlewares/auth'
import type { Route } from './+types/_index'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export const loader = async () => {
  throw redirect('/channels/@me')
}
