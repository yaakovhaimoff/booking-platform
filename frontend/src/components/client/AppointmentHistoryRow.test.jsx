import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AppointmentHistoryRow from './AppointmentHistoryRow'

afterEach(() => vi.restoreAllMocks())

function renderRow(overrides = {}) {
  const appointment = {
    id: 3, tenantId: 'tenant-1', shopName: 'Shop', shopSlug: 'shop', shopAddress: 'Main St',
    status: 'CONFIRMED', startTime: '2099-01-05T14:00:00', endTime: '2099-01-05T14:30:00', ...overrides,
  }
  return render(
    <MemoryRouter><table><tbody><AppointmentHistoryRow appointment={appointment} onCancel={() => {}} /></tbody></table></MemoryRouter>,
  )
}

describe('add to calendar in the customer bookings table', () => {
  it('downloads a calendar file for an upcoming booking', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderRow()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(URL.createObjectURL.mock.calls[0][0].type).toBe('text/calendar;charset=utf-8')
    expect(click).toHaveBeenCalledOnce()
  })

  it('hides the button for a cancelled booking', () => {
    renderRow({ status: 'CANCELLED' })
    expect(screen.queryByRole('button', { name: 'Add to calendar' })).not.toBeInTheDocument()
  })

  it('hides the button for a past booking', () => {
    renderRow({ startTime: '2000-01-05T14:00:00', endTime: '2000-01-05T14:30:00' })
    expect(screen.queryByRole('button', { name: 'Add to calendar' })).not.toBeInTheDocument()
  })
})
