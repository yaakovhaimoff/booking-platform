import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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

function renderTab() {
  return render(<MemoryRouter><AnalyticsTab tenant={tenant} /></MemoryRouter>)
}

beforeEach(() => {
  getServices.mockResolvedValue([{ id: 1, name: 'Haircut', price: '20.00' }])
})

describe('analytics tab', () => {
  it('splits confirmed from pending revenue and links the pending count to the queue', async () => {
    getAppointments.mockResolvedValue([
      { id: 1, serviceId: 1, status: 'CONFIRMED', clientName: 'Ann', clientPhone: '111', startTime: `${month}-02T10:00:00` },
      { id: 2, serviceId: 1, status: 'PENDING', clientName: 'Bob', clientPhone: '222', startTime: `${month}-03T10:00:00` },
    ])
    renderTab()

    const expected = (await screen.findByText('Expected revenue')).nextSibling
    expect(expected).toHaveTextContent(/40/)
    expect(expected.nextSibling).toHaveTextContent(/20.*confirmed \+.*20.*pending/)
    expect(screen.getByRole('link', { name: '1 pending' })).toHaveAttribute('href', '/?tab=queue')
    expect(screen.getByText('Clients').nextSibling).toHaveTextContent('2')
    expect(getAppointments).toHaveBeenCalledWith('token', 7, null)
  })

  it('explains what repeat clients means', async () => {
    getAppointments.mockResolvedValue([
      { id: 1, serviceId: 1, status: 'CONFIRMED', clientName: 'Ann', clientPhone: '111', startTime: `${month}-02T10:00:00` },
      { id: 2, serviceId: 1, status: 'CONFIRMED', clientName: 'Ann', clientPhone: '111', startTime: `${month}-04T10:00:00` },
    ])
    renderTab()

    expect(await screen.findByText('0 first-time, 1 repeat')).toBeInTheDocument()
    expect(screen.getByText(/Repeat means the client has booked at least twice/)).toBeInTheDocument()
  })

  it('shows an empty message and can switch to the week view and back', async () => {
    getAppointments.mockResolvedValue([])
    renderTab()

    expect(await screen.findByText('No bookings in this period.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Week' }))
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Month' }))
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument()
  })

  it('shows the year view with its best month and steps between years', async () => {
    getAppointments.mockResolvedValue([
      { id: 1, serviceId: 1, status: 'CONFIRMED', clientName: 'Ann', clientPhone: '111', startTime: `${month}-02T10:00:00` },
    ])
    renderTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Year' }))
    expect(screen.getByText(String(new Date().getFullYear()))).toBeInTheDocument()
    expect(screen.getByText('Expected revenue per month')).toBeInTheDocument()
    expect(screen.getByText(/Best month:/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Previous year' }))
    expect(screen.getByText(String(new Date().getFullYear() - 1))).toBeInTheDocument()
    expect(screen.getByText('No bookings in this period.')).toBeInTheDocument()
  })

  it('shows an error when loading fails', async () => {
    getAppointments.mockRejectedValue(new Error('boom'))
    renderTab()

    expect(await screen.findByText('Failed to load appointments.')).toBeInTheDocument()
  })
})

describe('analytics tab without pending bookings', () => {
  it('hides every pending part when all bookings in the period are confirmed', async () => {
    getAppointments.mockResolvedValue([
      { id: 1, serviceId: 1, status: 'CONFIRMED', clientName: 'Ann', clientPhone: '111', startTime: `${month}-02T10:00:00` },
      { id: 2, serviceId: 1, status: 'CONFIRMED', clientName: 'Bob', clientPhone: '222', startTime: `${month}-03T10:00:00` },
    ])
    renderTab()

    const expected = (await screen.findByText('Expected revenue')).nextSibling
    expect(expected).toHaveTextContent(/40/)
    expect(expected.nextSibling?.textContent ?? '').not.toMatch(/pending/)
    expect(screen.queryByText(/pending/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /pending/ })).not.toBeInTheDocument()
  })
})
