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
    footer: {
      height: 30,
    },
  } satisfies AppShellProps

  return (
    <AppShell
      {...appShellConfig}
      styles={{ footer: { borderColor: 'var(--transcendence-border-color)' } }}
    >
      {navbar && (
        <AppShell.Navbar bg="#121214" bd="none">
          {navbar}
        </AppShell.Navbar>
      )}

      <AppShell.Main bg="#1A1A1E">{children}</AppShell.Main>

      <AppShell.Footer bg="#121214">
        <Center>
          <Text>ft_transcendence</Text>
        </Center>
      </AppShell.Footer>
    </AppShell>
  )
}
