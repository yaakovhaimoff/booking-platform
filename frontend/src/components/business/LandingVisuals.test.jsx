import { beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { HeroMockup, RequestStack } from './LandingVisuals'

beforeAll(() => {
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
})

describe('landing page appointment cards', () => {
  it('the day view in the dashboard mockup shows the hour without a date line', () => {
    const { container } = render(<HeroMockup />)
    const dayView = container.querySelector('h3.capitalize').nextElementSibling
    expect(dayView.querySelectorAll('.text-2xl').length).toBeGreaterThan(0)
    expect(dayView.querySelectorAll('.text-2xl + .text-xs')).toHaveLength(0)
  })

  it('the request queue cards keep their date line', () => {
    const { container } = render(<RequestStack />)
    expect(container.querySelectorAll('.text-2xl + .text-xs').length).toBeGreaterThan(0)
  })
})
