import { ActionIcon, Group, Text } from '@mantine/core'
import { IconChevronLeft, IconHash } from '@tabler/icons-react'
import { useOutletContext } from 'react-router'
import { TextChannelView } from '../../_text/TextChannelView'
import type { GuildOutletContext } from '../route'
import type { Route } from './+types/route'

export { action } from './api/action.server'
export { loader } from './api/loader.server'

export default function ChannelRoute({
  loaderData,
  params,
  actionData,
}: Route.ComponentProps) {
  const { messages, channel, locale } = loaderData
  const { guild, loggedInUser, openNavbar } =
    useOutletContext<GuildOutletContext>()
  const channelId = params.channelId

  return (
    <TextChannelView
      channelId={channelId}
      initialMessages={messages}
      locale={locale}
      websocketUrl={`/api/channels/guild/${channelId}/ws`}
      headerContent={
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
          <IconHash size={20} />
          <Text fw="bold" size="lg" maw="40rem" truncate="end">
            {channel?.name ?? 'unknown-channel'}
          </Text>
        </Group>
      }
      inputPlaceholder={`Message #${channel?.name ?? 'channel'}`}
      actionData={actionData ?? null}
      guild={guild}
      loggedInUser={loggedInUser}
    />
  )
}
