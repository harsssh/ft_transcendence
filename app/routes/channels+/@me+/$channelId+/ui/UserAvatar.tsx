import { Avatar, getSize, type MantineSize } from '@mantine/core'
import { useId } from 'react'
import * as R from 'remeda'
import { useOnlineStatus } from '../../../../../contexts/onlineStatus'

export type UserAvatarProps = {
  name: string | null
  src: string | null
  size?: number | MantineSize
} & (
  | {
      withOnlineStatus: true
      id: number
    }
  | {
      withOnlineStatus?: false
      id?: undefined
    }
)

export function UserAvatar({
  id,
  name,
  src,
  size = 40,
  withOnlineStatus,
}: UserAvatarProps) {
  const maskId = useId()
  const onlineStatus = useOnlineStatus({ id })

  if (!withOnlineStatus) {
    return (
      <Avatar src={src} radius="50%" color="initials" size={size}>
        {name?.slice(0, 2).toUpperCase() ?? '??'}
      </Avatar>
    )
  }

  const sizeCss = R.conditional(
    size,
    [R.isDeepEqual('xs'), () => '16px'],
    [R.isDeepEqual('sm'), () => '26px'],
    [R.isDeepEqual('md'), () => '38px'],
    [R.isDeepEqual('lg'), () => '56px'],
    [R.isDeepEqual('xl'), () => '84px'],
    getSize,
  )

  return (
    <svg style={{ width: sizeCss, height: sizeCss }}>
      <title>avatar</title>
      <defs>
        <mask
          id={`svg-mask-status-online-${maskId}`}
          maskContentUnits="objectBoundingBox"
          viewBox="0 0 1 1"
        >
          <circle fill="white" cx="0.5" cy="0.5" r="0.5" />
        </mask>
        <mask
          id={`svg-mask-status-offline-${maskId}`}
          maskContentUnits="objectBoundingBox"
          viewBox="0 0 1 1"
        >
          <circle fill="white" cx="0.5" cy="0.5" r="0.5" />
          <circle fill="black" cx="0.5" cy="0.5" r="0.25" />
        </mask>
        <mask
          id={`svg-mask-avatar-${maskId}`}
          maskContentUnits="objectBoundingBox"
          viewBox="0 0 1 1"
        >
          <circle fill="white" cx="0.5" cy="0.5" r="0.5" />
          <circle fill="black" cx="0.85" cy="0.85" r="0.175" />
        </mask>
      </defs>
      <foreignObject
        x="0"
        y="0"
        width="100%"
        height="100%"
        mask={`url(#svg-mask-avatar-${maskId})`}
      >
        <Avatar src={src} radius="50%" color="initials" size={size}>
          {name?.slice(0, 2).toUpperCase() ?? '??'}
        </Avatar>
      </foreignObject>
      <rect
        width="20%"
        height="20%"
        x="75%"
        y="75%"
        fill={onlineStatus === 'online' ? '#45a366' : '#84858d'}
        mask={
          onlineStatus === 'online'
            ? `url(#svg-mask-status-online-${maskId})`
            : `url(#svg-mask-status-offline-${maskId})`
        }
      />
    </svg>
  )
}
