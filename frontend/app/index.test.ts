/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { App } from '.'
import '@testing-library/jest-dom/vitest'

describe('App', () => {
  it(`should contain 'some message'`, () => {
    const app = App()

    expect(app).toHaveTextContent('some message')
  })
})
