import { ActionIcon, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
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

  const { openNavbar } = useOutletContext<ChannelsOutletContext>()

  const [profileSidebarOpened, { toggle: toggleProfileSidebar }] =
    useDisclosure(false)

  return (
    <TextChannelView
      channelId={channelId}
      initialMessages={messages}
      locale={locale}
      websocketUrl={`/api/channels/${channelId}/ws`}
      headerContent={
        <>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Open navbar"
              onClick={openNavbar}
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
          <ActionIcon.Group>
            <IconButton
              label={
                profileSidebarOpened ? 'Hide User Profile' : 'Show User Profile'
              }
              onClick={toggleProfileSidebar}
              strong={profileSidebarOpened}
            >
              <IconUserCircle />
            </IconButton>
          </ActionIcon.Group>
        </>
      }
      inputPlaceholder={`Message @${partner?.name ?? 'user'}`}
      asideContent={
        profileSidebarOpened ? <UserProfileSidebar profile={partner} /> : null
      }
      actionData={actionData ?? null}
      loggedInUser={loaderData.loggedInUser}
    />
  )
}
