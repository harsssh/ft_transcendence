import { AppShell, type AppShellProps, Center, Text } from '@mantine/core'

type Props = {
  navbar?: React.ReactNode
  navbarWidth?: number
  children: React.ReactNode
}

export function Scaffold({ children, navbar, navbarWidth }: Props) {
  const appShellConfig = {
    ...(navbar
      ? {
          navbar: { width: navbarWidth ?? 'auto', breakpoint: 'sm' },
        }
      : {}),
  } satisfies AppShellProps

  return (
    <AppShell {...appShellConfig}>
      {navbar && <AppShell.Navbar>{navbar}</AppShell.Navbar>}

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Footer>
        <Center>
          <Text>ft_transcendence</Text>
        </Center>
      </AppShell.Footer>
    </AppShell>
  )
}
