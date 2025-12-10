import { AppShell, Center, Text } from '@mantine/core'
import { redirect } from 'react-router'
import type { Route } from './+types/_index'

export const loader = () => {
  throw redirect('/signup')
}
