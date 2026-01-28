import { Box, Group, Text } from '@mantine/core'
import { TimeValue } from '@mantine/dates'
import { useHover } from '@mantine/hooks'
import { useParams } from 'react-router'
import { useContext, useSyncExternalStore } from 'react'
import { LoggedInUserContext } from '../../../contexts/user'
import { UserAvatarPopover } from './UserAvatarPopover'

import { ThreeViewer } from '../../../../3D/ui/ThreeViewer'

type Props = {
  id: number
  createdAt: Date
  senderId: number
  senderName: string
  senderDisplayName: string | null
  content: string
  avatarSrc?: string | undefined | null
  withProfile?: boolean
  asset3D?: {
    status: string
    modelUrl: string | null
    // [3D Refine] Added mode property
    mode?: string
  } | undefined | null
}

export function Message({
  id,
  createdAt,
  senderId,
  senderName,
  senderDisplayName,
  content,
  avatarSrc = null,
  withProfile = false,
  asset3D,
}: Props) {
  // サーバーとクライアントのロケールが異なる場合にhydration errorが発生するため、それを避けるハッチ
  const localeTimeCreatedAt = useSyncExternalStore(
    () => () => { },
    () => createdAt.toLocaleTimeString(),
    () => createdAt.toISOString(),
  )
  const { ref: hoverRef, hovered } = useHover()
  const loggedInUser = useContext(LoggedInUserContext)
  const params = useParams()
  const channelId = params['channelId'] ? parseInt(params['channelId']) : undefined

  return (
    <Box
      ref={hoverRef}
      pl={72}
      pos="relative"
      {...(hovered ? { bg: '#242428' } : {})}
      style={
        withProfile
          ? {
            marginTop: 'var(--mantine-spacing-md)',
          }
          : {}
      }
    >
      {withProfile && (
        <Box style={{ position: 'absolute', left: '16px', top: '2px' }}>
          <UserAvatarPopover
            id={senderId}
            name={senderName}
            displayName={senderDisplayName}
            src={avatarSrc}
            isEditable={loggedInUser?.name === senderName}
          />
        </Box>
      )}
      {!withProfile && hovered && (
        <Box style={{ position: 'absolute', left: '32px', top: '7px' }}>
          <Text size="11px" c="dimmed">
            <TimeValue value={localeTimeCreatedAt} />
          </Text>
        </Box>
      )}
      <Box>
        {withProfile && (
          <Group align="center" gap="xs">
            <Text fw={700} size="sm" maw="40rem" truncate="end">
              {senderDisplayName ?? senderName}
            </Text>
            <Text size="xs" c="dimmed">
              <TimeValue value={localeTimeCreatedAt} />
            </Text>
          </Group>
        )}
        <Group>
          <Text style={{ wordBreak: 'break-word' }}>{content}</Text>
        </Group>
        {asset3D && (
          <Box mt="sm" style={{ width: 300, height: 300, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <ThreeViewer
              modelUrl={asset3D.modelUrl}
              status={asset3D.status as any}
              mode={asset3D.mode}
              channelId={channelId}
              messageId={id} // Assuming 'id' is available in scope (props)
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
