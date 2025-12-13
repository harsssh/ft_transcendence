import { Outlet } from 'react-router'
import { Scaffold } from '../_shared/ui/Scaffold'

export default function AuthLayout() {
  return (
    <Scaffold>
      <Outlet />
    </Scaffold>
  )
}
