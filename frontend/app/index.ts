import { client } from '../shared/api/client'
import './style.css'

document.addEventListener('DOMContentLoaded', async () => {
  const res = await client.helloService.say({ sentence: 'hello' })

  document
    .querySelector('#app')
    ?.insertAdjacentHTML(
      'afterend',
      `<h1 class="text-3xl underline">${res.sentence}</h1>`,
    )
})
