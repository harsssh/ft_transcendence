import { authMiddleware } from 'app/middlewares/auth'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]
