import { Avatar, type MantineSize } from '@mantine/core'

type Props = {
  name?: string | null
  src?: string | null
  size?: number | MantineSize
}

export function UserAvatar({ name = null, src = null, size = 40 }: Props) {
  return (
    <Avatar src={src} radius="50%" color="initials" size={size}>
      {name?.slice(0, 2).toUpperCase() ?? '??'}
    </Avatar>
  )
}
