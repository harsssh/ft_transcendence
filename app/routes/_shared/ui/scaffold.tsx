import { AppShell, type AppShellProps, Center, Text } from '@mantine/core'

type Props = {
  navbar?: React.ReactNode
  children: React.ReactNode
}

export function Scaffold({ children, navbar }: Props) {
  const appShellConfig = {
    ...(navbar
      ? {
          navbar: {
            width: 72,
            breakpoint: 'sm',
          },
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
