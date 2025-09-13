/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { createRouter } from './router'
import '@testing-library/jest-dom/vitest'

describe('Router', () => {
  function FooScreen() {
    const p = document.createElement('p')
    p.appendChild(document.createTextNode('foo'))
    return p
  }

  function BarScreen() {
    const p = document.createElement('p')
    p.appendChild(document.createTextNode('bar'))
    return p
  }

  it('should render corresponding element inside outlet', () => {
    const { outlet, router } = createRouter([
      {
        path: '/foo',
        element: FooScreen(),
      },
      {
        path: '/bar',
        element: BarScreen(),
      },
    ])

    router.push({ path: '/foo' })
    expect(outlet.childElementCount).toBe(1)
    expect(outlet.firstChild).toStrictEqual(FooScreen())

    router.push({ path: '/bar' })
    expect(outlet.childElementCount).toBe(1)
    expect(outlet.firstChild).toStrictEqual(BarScreen())
  })

  it('should render default 404 page if no matching route exists', () => {
    const { outlet, router } = createRouter([
      { path: '/foo', element: FooScreen() },
    ])

    router.push({ path: '/bar' })
    // expect(outlet.childElementCount).toBe(1)
    expect(outlet.firstChild).toHaveTextContent('Not Found')
  })
})
