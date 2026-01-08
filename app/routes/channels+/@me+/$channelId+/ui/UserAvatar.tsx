import { Avatar, type MantineSize } from '@mantine/core'

export type UserAvatarProps = {
  name: string | null
  src: string | null
  size?: number | MantineSize
}

export function UserAvatar({ name, src, size = 40 }: UserAvatarProps) {
  return (
    <Avatar src={src} radius="50%" color="initials" size={size}>
      {name?.slice(0, 2).toUpperCase() ?? '??'}
    </Avatar>
  )
}
