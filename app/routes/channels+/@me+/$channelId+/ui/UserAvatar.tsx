import { Avatar, type MantineSize } from '@mantine/core'

type Props = {
  name?: string | null | undefined
  src?: string | null | undefined
  size?: number | MantineSize
}

export function UserAvatar({ name = null, src = null, size = 40 }: Props) {
  return (
    <Avatar src={src} radius="xl" color="initials" size={size}>
      {name?.slice(0, 2).toUpperCase() ?? '??'}
    </Avatar>
  )
}
