import { Avatar } from '@mantine/core'

type Props = {
  name?: string | null | undefined
  src?: string | null | undefined
}

export function UserAvatar({ name = null, src = null }: Props) {
  return (
    <Avatar src={src} radius="xl" color="initials" size={40}>
      {name?.slice(0, 2).toUpperCase() ?? '??'}
    </Avatar>
  )
}
