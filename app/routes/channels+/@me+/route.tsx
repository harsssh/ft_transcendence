import { userContext } from 'app/contexts/user'
import { redirect } from 'react-router'
import type { Route } from './+types/route'

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = context.get(userContext)

  if (!user) {
    throw redirect('/signin')
  }

  return { user }
}

export default function Me({ loaderData }: Route.ComponentProps) {
  return <p>Hello, {loaderData.user.name}</p>
}
