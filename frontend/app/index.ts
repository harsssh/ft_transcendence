import { createRouter } from '../shared/lib/routing/router'
import { Index } from './routes/_index'
import './style.css'

export function App() {
  const { outlet } = createRouter([{ path: '/', element: Index() }])

  return outlet
}
