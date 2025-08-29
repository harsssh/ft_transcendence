import './style.css'

document
  .querySelector('#app')
  ?.insertAdjacentHTML(
    'afterend',
    `<h1 class="text-3xl underline">Hello 42!</h1>`,
  )
