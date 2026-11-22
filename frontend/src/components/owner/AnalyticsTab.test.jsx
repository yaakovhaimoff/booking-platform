import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalyticsTab from './AnalyticsTab'
import { getAppointments, getServices } from '../../api/ownerApi'
import { currentMonthKey } from '../../utils/analytics'

vi.mock('../../auth', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token' }) }))
vi.mock('../../api/ownerApi', () => ({ getAppointments: vi.fn(), getServices: vi.fn() }))

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

const tenant = { id: 7, currency: 'EUR' }
const month = currentMonthKey()

beforeEach(() => {
  getServices.mockResolvedValue([{ id: 1, name: 'Haircut', price: '20.00' }])
})

describe('analytics tab', () => {
  it('shows expected revenue, bookings and unique clients for the month', async () => {
    getAppointments.mockResolvedValue([
      { id: 1, serviceId: 1, status: 'CONFIRMED', clientName: 'Ann', clientPhone: '111', startTime: `${month}-02T10:00:00` },
      { id: 2, serviceId: 1, status: 'PENDING', clientName: 'Bob', clientPhone: '222', startTime: `${month}-03T10:00:00` },
    ])
    render(<AnalyticsTab tenant={tenant} />)

    expect((await screen.findByText('Expected revenue')).nextSibling).toHaveTextContent(/40/)
    expect(screen.getByText('Clients this month').nextSibling).toHaveTextContent('2')
    expect(screen.getAllByText('Bookings')[0].nextSibling).toHaveTextContent('2')
    expect(getAppointments).toHaveBeenCalledWith('token', 7, null)
  })

  it('shows an empty message for a month without bookings', async () => {
    getAppointments.mockResolvedValue([])
    render(<AnalyticsTab tenant={tenant} />)

    expect(await screen.findByText('No bookings in this month.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('No bookings in this month.')).toBeInTheDocument()
  })

  it('shows an error when loading fails', async () => {
    getAppointments.mockRejectedValue(new Error('boom'))
    render(<AnalyticsTab tenant={tenant} />)

    expect(await screen.findByText('Failed to load appointments.')).toBeInTheDocument()
  })
})
