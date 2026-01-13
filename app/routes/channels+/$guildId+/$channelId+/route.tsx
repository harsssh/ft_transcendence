import { Group, Text } from '@mantine/core'
import { IconHash } from '@tabler/icons-react'
import { TextChannelView } from '../../_text/TextChannelView'
import type { Route } from './+types/route'

export { action } from './api/action.server'
export { loader } from './api/loader.server'

export default function ChannelRoute({
  loaderData,
  params,
  actionData,
}: Route.ComponentProps) {
  const { messages, channel, locale } = loaderData
  const channelId = params.channelId

  return (
    <TextChannelView
      channelId={channelId}
      initialMessages={messages}
      locale={locale}
      websocketUrl={`/api/channels/guild/${channelId}/ws`}
      headerContent={
        <Group>
          <IconHash size={20} />
          <Text fw="bold" size="lg" maw="40rem" truncate="end">
            {channel?.name ?? 'unknown-channel'}
          </Text>
        </Group>
      }
      inputPlaceholder={`Message #${channel?.name ?? 'channel'}`}
      actionData={actionData ?? null}
    />
  )
}
