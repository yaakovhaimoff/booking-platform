import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import ScrollManager from './ScrollManager'

// A plain <a href="#faq"> click is reported by the browser router as a POP to an entry whose key is
// "default", the same key as the page's first entry, so a saved scroll position exists for it.
function setup() {
  const router = createMemoryRouter(
    [{ path: '*', element: <><ScrollManager /><div id="faq">faq</div></> }],
    { initialEntries: [{ pathname: '/for-business', key: 'default' }, { pathname: '/for-business', hash: '#faq', key: 'default' }], initialIndex: 0 },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.setItem('scroll-positions', JSON.stringify({ default: 500 }))
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
  delete Element.prototype.scrollIntoView
})

describe('scroll manager with in-page anchor links', () => {
  it('goes to the section on the first click instead of restoring the old scroll position', async () => {
    const router = setup()
    window.scrollTo.mockClear()

    await act(async () => { router.navigate(1) })
    await act(async () => { vi.advanceTimersByTime(1500) })

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalledWith(0, 500)
  })
})
