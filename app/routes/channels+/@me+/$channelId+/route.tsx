import { ActionIcon, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconUserCircle } from '@tabler/icons-react'
import { IconButton } from '../../../_shared/ui/IconButton'
import { TextChannelView } from '../../_text/TextChannelView'
import { UserAvatar } from '../../ui/UserAvatar'
import { UserProfileSidebar } from '../../ui/UserProfileSidebar'
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
          <Group>
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
    />
  )
}
