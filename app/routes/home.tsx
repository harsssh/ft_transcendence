import { dbContext } from '~/context'
import { Welcome } from '../welcome/welcome'
import type { Route } from './+types/home'
import { usersTable } from 'db/schema'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ]
}

export const loader = async ({ context }: Route.LoaderArgs) => {
  const db = context.get(dbContext)
  console.log(await db.select().from(usersTable))
}

export default function Home() {
  return <Welcome />
}
