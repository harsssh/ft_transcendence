export function Index() {
  const div = document.createElement('div')
  div.innerHTML = `<h1 class="text-3xl underline">some message</h1>`
  return div.firstChild ?? div
}
