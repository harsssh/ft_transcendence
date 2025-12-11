import { AppShell, Center, Text } from '@mantine/core'
import { Outlet } from 'react-router'
import { Footer } from '../_shared/ui/footer'

export default function AuthLayout() {
  return (
    <AppShell>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  )
}
