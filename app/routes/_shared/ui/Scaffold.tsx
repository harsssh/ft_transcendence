import { AppShell, type AppShellProps, Center, Text } from '@mantine/core'

type Props = {
  navbar?: React.ReactNode
  navbarWidth?: number
  children: React.ReactNode
}

export function Scaffold({ children, navbar, navbarWidth }: Props) {
  const appShellConfig = {
    header: {
      height: 30,
    },
    ...(navbar
      ? {
          navbar: { width: navbarWidth ?? 'auto', breakpoint: 'sm' },
        }
      : {}),
  } satisfies AppShellProps

  return (
    <AppShell {...appShellConfig} withBorder={false}>
      <AppShell.Header bg="#121214">
        <Center>
          <Text>ft_transcendence</Text>
        </Center>
      </AppShell.Header>

      {navbar && (
        <AppShell.Navbar bg="#121214" bd="none">
          {navbar}
        </AppShell.Navbar>
      )}

      <AppShell.Main bg="#1A1A1E">{children}</AppShell.Main>
    </AppShell>
  )
}
