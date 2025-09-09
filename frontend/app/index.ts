import './style.css'

export function App() {
  const container = document.createElement('div')
  container.insertAdjacentHTML(
    'afterbegin',
    `<h1 class="text-3xl underline">some message</h1>`,
  )

  return container
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('#app')?.appendChild(App())
})
