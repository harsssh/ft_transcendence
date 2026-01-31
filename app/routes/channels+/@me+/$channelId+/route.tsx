import { ActionIcon, Box, Group, Text, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconChevronLeft, IconUserCircle } from '@tabler/icons-react'
import { useOutletContext } from 'react-router'
import { IconButton } from '../../../_shared/ui/IconButton'
import { TextChannelView } from '../../_text/TextChannelView'
import { UserAvatar } from '../../_text/ui/UserAvatar'
import { UserProfileSidebar } from '../../_text/ui/UserProfileSidebar'
import type { ChannelsOutletContext } from '../../route'
import type { Route } from './+types/route'

export { action } from './api/action.server'
export { loader } from './api/loader.server'

export default function DMChannel({
  loaderData,
  params,
  actionData,
}: Route.ComponentProps) {
  const { messages, partner, locale } = loaderData
  const channelId = params.channelId

  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const { openNavbar } = useOutletContext<ChannelsOutletContext>()

  const [profileSidebarOpened, { toggle: toggleProfileSidebar, close }] =
    useDisclosure(false)

  return (
    <TextChannelView
      channelId={channelId}
      initialMessages={messages}
      locale={locale}
      websocketUrl={`/api/channels/${channelId}/ws`}
      headerContent={
        <>
          <Group
            gap="xs"
            // onClick={
            //   isMobile
            //     ? () => {
            //         toggleProfileSidebar()
            //       }
            //     : undefined
            // }
            // style={isMobile ? { cursor: 'pointer' } : undefined}
            // role={isMobile ? 'button' : undefined}
            // tabIndex={isMobile ? 0 : undefined}
            // onKeyDown={
            //   isMobile
            //     ? (event) => {
            //         if (event.key === 'Enter' || event.key === ' ') {
            //           event.preventDefault()
            //           toggleProfileSidebar()
            //         }
            //       }
            //     : undefined
            // }
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Open navbar"
              onClick={(event) => {
                event.stopPropagation()
                openNavbar()
              }}
              hiddenFrom="sm"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <UserAvatar
              name={partner?.name}
              src={partner?.avatarUrl}
              size="sm"
            />
            <Text fw="bold" size="lg" maw="40rem" truncate="end">
              {partner?.name ?? 'Unknown User'}
            </Text>
          </Group>
          {/* <Box visibleFrom="sm">
            <ActionIcon.Group>
              <IconButton
                label={
                  profileSidebarOpened
                    ? 'Hide User Profile'
                    : 'Show User Profile'
                }
                onClick={toggleProfileSidebar}
                strong={profileSidebarOpened}
              >
                <IconUserCircle />
              </IconButton>
            </ActionIcon.Group>
          </Box> */}
        </>
      }
      inputPlaceholder={`Message @${partner?.name ?? 'user'}`}
      asideContent={
        profileSidebarOpened ? (
          <UserProfileSidebar
            profile={partner}
            variant={isMobile ? 'drawer' : 'sidebar'}
          />
        ) : null
      }
      asideDrawerTitle={partner?.name ?? 'User Profile'}
      asideDrawerOpened={profileSidebarOpened}
      onAsideDrawerClose={close}
      actionData={actionData ?? null}
      loggedInUser={loaderData.loggedInUser}
    />
  )
}
