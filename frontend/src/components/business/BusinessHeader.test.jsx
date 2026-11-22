import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BusinessHeader from './BusinessHeader'
import { PUBLIC } from '../../i18nPublic'

afterEach(() => { vi.restoreAllMocks(); window.scrollY = 0; document.body.innerHTML = '' })

const renderHeader = () => render(<MemoryRouter><BusinessHeader /></MemoryRouter>)
const scrollTo = y => { window.scrollY = y; act(() => { window.dispatchEvent(new Event('scroll')) }) }

describe('BusinessHeader', () => {
  it('is sticky and starts wide and unscrolled at the top of the page', () => {
    renderHeader()
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('sticky', 'top-0')
    expect(header).not.toHaveAttribute('data-scrolled')
  })

  it('shrinks into the pill once scrolled and goes back at the top', async () => {
    renderHeader()
    const header = screen.getByRole('banner')
    scrollTo(300)
    await waitFor(() => expect(header).toHaveAttribute('data-scrolled'))
    scrollTo(0)
    await waitFor(() => expect(header).not.toHaveAttribute('data-scrolled'))
  })

  it('links to each landing section and keeps the sign-up button', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Business' })
    expect(nav.querySelectorAll('a')).toHaveLength(4)
    expect(screen.getByRole('link', { name: PUBLIC.en.bzNavDay })).toHaveAttribute('href', '#day')
    expect(screen.getByRole('link', { name: PUBLIC.en.bzNavFaq })).toHaveAttribute('href', '#faq')
    expect(screen.getByRole('link', { name: PUBLIC.en.pSignUp })).toHaveAttribute('href', '/partner')
  })

  it('highlights the link of the section that has reached the top of the screen', async () => {
    ;['day', 'features', 'steps', 'faq'].forEach((id, index) => {
      const section = document.createElement('section')
      section.id = id
      section.getBoundingClientRect = () => ({ top: [-400, -100, 600, 1400][index] })
      document.body.appendChild(section)
    })
    renderHeader()
    await waitFor(() => expect(screen.getByRole('link', { name: PUBLIC.en.pFeatures })).toHaveAttribute('aria-current', 'true'))
    expect(screen.getByRole('link', { name: PUBLIC.en.bzNavDay })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: PUBLIC.en.bzNavSteps })).not.toHaveAttribute('aria-current')
  })
})
