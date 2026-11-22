import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ConsumerHeader from './ConsumerHeader'
import { PUBLIC } from '../../i18nPublic'

afterEach(() => { window.scrollY = 0 })

const renderHeader = () => render(<MemoryRouter><ConsumerHeader /></MemoryRouter>)

describe('ConsumerHeader', () => {
  it('is a sticky floating header that shrinks into a pill once the page is scrolled', async () => {
    renderHeader()
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('sticky', 'top-0')
    expect(header).not.toHaveAttribute('data-scrolled')
    window.scrollY = 300
    act(() => { window.dispatchEvent(new Event('scroll')) })
    await waitFor(() => expect(header).toHaveAttribute('data-scrolled'))
  })

  it('still sends logged-out visitors to log in or to the business site', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: PUBLIC.en.pLogIn })).toHaveAttribute('href', '/user-flow')
    expect(screen.getByRole('link', { name: PUBLIC.en.pForBusinesses })).toHaveAttribute('href', '/for-business')
  })
})
