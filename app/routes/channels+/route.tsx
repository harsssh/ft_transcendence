import { authMiddleware } from 'app/middlewares/auth'
import { Outlet } from 'react-router'
import { Scaffold } from '../_shared/ui/scaffold'
import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

export default function Channels() {
  return (
    <Scaffold navbar="navbar">
      <Outlet />
    </Scaffold>
  )
}
