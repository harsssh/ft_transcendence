import { createRouter } from './router'
import './style.css'

export function App() {
  const container = document.createElement('div')
  container.insertAdjacentHTML(
    'afterbegin',
    `<h1 class="text-3xl underline">some message</h1>`,
  )

  return container
}

const router = createRouter({
  onNavigated: ({ element }) => {
    document.getElementById('app')?.replaceChildren(element)
  },
  routes: [{ path: '/', element: App() }],
})

document.addEventListener('DOMContentLoaded', async () => {
  router.push({ path: '/' })
})
