/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
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

  it('should call `onNavigated` with state on pushed', () => {
    const onNavigated = vi.fn()
    const router = createRouter({
      onNavigated,
      routes: [
        {
          path: '/foo',
          element: FooScreen(),
        },
        {
          path: '/bar',
          element: BarScreen(),
        },
      ],
    })

    router.push({ path: '/foo' })
    router.push({ path: '/bar' })

    expect(onNavigated.mock.calls).toStrictEqual([
      [{ element: FooScreen() }],
      [{ element: BarScreen() }],
    ])
  })

  it('should throw error on pushed if no matching route exists', () => {
    const onNavigated = vi.fn()
    const router = createRouter({
      onNavigated,
      routes: [{ path: '/foo', element: FooScreen() }],
    })

    expect(() => router.push({ path: '/bar' })).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining('/bar'),
      }),
    )
  })
})
