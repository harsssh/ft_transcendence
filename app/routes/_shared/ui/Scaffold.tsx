import {
  AppShell,
  type AppShellProps,
  Center,
  Group,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useDrag } from '@use-gesture/react'
import { Link } from 'react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  navbar?: React.ReactNode
  navbarWidth?: number
  children: React.ReactNode
  navbarOpened?: boolean
  onNavbarOpenedChange?: (opened: boolean) => void
}

export function Scaffold({
  children,
  navbar,
  navbarWidth,
  navbarOpened,
  onNavbarOpenedChange,
}: Props) {
  const [uncontrolledOpened, uncontrolledHandlers] = useDisclosure(false)
  const [navbarDragX, setNavbarDragX] = useState(0)
  const [navbarDragging, setNavbarDragging] = useState(false)

  const opened = navbarOpened ?? uncontrolledOpened

  const setOpened = useCallback(
    (next: boolean) => {
      if (onNavbarOpenedChange) {
        onNavbarOpenedChange(next)
        return
      }
      if (next) uncontrolledHandlers.open()
      else uncontrolledHandlers.close()
    },
    [onNavbarOpenedChange, uncontrolledHandlers],
  )

  const bindNavbarSwipe = useDrag(
    ({
      down,
      last,
      movement: [mx],
      velocity: [vx],
      direction: [dx],
      event,
    }) => {
      if (!opened) return

      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        !window.matchMedia('(max-width: 47.99em)').matches
      ) {
        return
      }

      const currentTarget = (event.currentTarget ?? event.target) as
        | HTMLElement
        | null
        | undefined
      const width =
        currentTarget?.getBoundingClientRect().width ??
        (typeof window !== 'undefined' ? window.innerWidth : 0)

      // 追従（左方向だけ）: 指の移動量に追従しつつ、0 ~ -width にクランプ
      const clampedX = Math.max(-width, Math.min(0, mx * 1))
      setNavbarDragging(down)
      setNavbarDragX(down ? clampedX : 0)

      if (!last) return

      // 素早いスワイプ（左方向）は閾値によらずclose
      // NOTE: velocityは絶対値なのでdirectionで左右を判定する
      const isFastSwipe = vx >= 0.8
      const isLeft = dx < 0
      if (isFastSwipe && isLeft) {
        setOpened(false)
        return
      }

      // Navbarの右端が画面中央より左に来たらclose
      // (= translateX が -width/2 を超えたらclose)
      if (width > 0 && clampedX <= -width / 2) {
        setOpened(false)
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      // 縦スクロールは許容（横スワイプだけ拾う）
      // iOSの慣性スクロールと競合しにくい設定
      // ※ `touchAction` はDOM側に指定
    },
  )

  useEffect(() => {
    if (opened) return
    setNavbarDragging(false)
    setNavbarDragX(0)
  }, [opened])

  const appShellConfig = useMemo(() => {
    const navbarConfig: NonNullable<AppShellProps['navbar']> | null = navbar
      ? {
          // mobile時はMantineが自動で100%幅にする
          width: navbarWidth ?? 372,
          breakpoint: 'sm',
        }
      : null

    return {
      header: {
        height: 30,
      },
      ...(navbarConfig ? { navbar: navbarConfig } : {}),
    } satisfies AppShellProps
  }, [navbar, navbarWidth])

  return (
    <AppShell {...appShellConfig} withBorder={false}>
      <AppShell.Header bg="#121214">
        <Center>
          <Group>
            <Link
              to="/terms-of-service"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Text>Terms of Service</Text>
            </Link>
            <Link
              to="/privacy-policy"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Text>Privacy Policy</Text>
            </Link>
          </Group>
        </Center>
      </AppShell.Header>

      {navbar && (
        <AppShell.Navbar
          bg="transparent"
          bd="none"
          data-testid="app-navbar"
          data-opened={opened ? 'true' : 'false'}
          className="app-navbar app-navbar-swipe"
          style={{
            transform: navbarDragging
              ? `translateX(${navbarDragX}px)`
              : undefined,
            transition: navbarDragging ? 'none' : undefined,
          }}
          {...bindNavbarSwipe()}
        >
          <div
            style={{
              height: '100%',
              background: '#121214',
            }}
          >
            {navbar}
          </div>
        </AppShell.Navbar>
      )}

      <AppShell.Main
        bg="#1A1A1E"
        h="calc(100vh - var(--app-shell-header-height, 0px))"
      >
        {children}
      </AppShell.Main>
    </AppShell>
  )
}