import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VenueCard from './VenueCard'

function renderCard(venue) {
  return render(<MemoryRouter><VenueCard venue={venue} /></MemoryRouter>)
}

describe('VenueCard', () => {
  it('shows the profile photo, not the cover photo', () => {
    const { container } = renderCard({
      slug: 'nails', name: 'Nails', logoUrl: 'https://img.example.com/logo.webp', coverUrl: 'https://img.example.com/cover.webp',
    })

    const photo = container.querySelector('[style*="background-image"]')
    expect(photo.style.backgroundImage).toContain('logo.webp')
    expect(photo.style.backgroundImage).not.toContain('cover.webp')
  })

  it('falls back to the first letter when there is no profile photo, even with a cover photo', () => {
    const { container } = renderCard({ slug: 'nails', name: 'Nails', coverUrl: 'https://img.example.com/cover.webp' })

    expect(container.querySelector('[style*="background-image"]')).toBeNull()
    expect(screen.getByText('n')).toBeInTheDocument()
  })

  it('links to the store page', () => {
    renderCard({ slug: 'nails', name: 'Nails' })

    expect(screen.getByRole('link')).toHaveAttribute('href', '/store/nails')
  })
})
