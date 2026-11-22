import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AppointmentHistoryCard from './AppointmentHistoryCard'

function renderCard(overrides = {}, onCancel = () => {}) {
  const appointment = {
    id: 3, tenantId: 'tenant-1', shopName: 'Shop', shopSlug: 'shop',
    status: 'CONFIRMED', startTime: '2099-01-05T14:00:00', endTime: '2099-01-05T14:30:00', ...overrides,
  }
  return render(<MemoryRouter><AppointmentHistoryCard appointment={appointment} onCancel={onCancel} /></MemoryRouter>)
}

describe('customer booking card on a phone', () => {
  it('shows a Cancel button for an upcoming booking and calls onCancel with the booking id', async () => {
    const onCancel = vi.fn()
    renderCard({}, onCancel)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledWith(3)
    expect(screen.getByRole('button', { name: 'Add to calendar' })).toBeInTheDocument()
  })

  it('hides both buttons for a cancelled booking', () => {
    renderCard({ status: 'CANCELLED' })
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to calendar' })).not.toBeInTheDocument()
  })

  it('hides both buttons for a past booking', () => {
    renderCard({ startTime: '2000-01-05T14:00:00', endTime: '2000-01-05T14:30:00' })
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })
})
