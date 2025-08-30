import './style.css'

document.addEventListener('DOMContentLoaded', async () => {
  document
    .querySelector('#app')
    ?.insertAdjacentHTML(
      'afterend',
      `<h1 class="text-3xl underline">some message</h1>`,
    )
})
