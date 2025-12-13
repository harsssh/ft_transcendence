import type { Route } from './+types/route'

export const loader = async () => {
  return {}
}

export default function DMChannels({ params }: Route.ComponentProps) {
  return <p>{params.userId}</p>
}
