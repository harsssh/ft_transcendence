import { Text } from '@mantine/core'
import { userContext } from 'app/contexts/user'
import { redirect } from 'react-router'
import type { ChannelsHandle } from '../_shared/handle'
import type { Route } from './+types/route'

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext)

  if (!user) {
    throw redirect('/signin')
  }

  return { user }
}

export const handle: ChannelsHandle<Route.ComponentProps['loaderData']> = {
  navbar: (_data) => <Text>hello</Text>,
  navbarWidth: 302,
}

export default function Me({ loaderData }: Route.ComponentProps) {
  return <p>Hello, {loaderData.user.name}</p>
}
