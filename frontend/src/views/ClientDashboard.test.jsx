import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ClientDashboard from './ClientDashboard'
import { listTenants } from '../api/tenantApi'
import { getMyAppointments } from '../api/clientApi'

vi.mock('../auth', () => ({
  useAuth0: () => ({ user: { name: 'Ann', login: '123456' }, logout: vi.fn(), getAccessTokenSilently: async () => 'token' }),
}))
vi.mock('../api/tenantApi', () => ({ listTenants: vi.fn() }))
vi.mock('../api/clientApi', () => ({ getMyAppointments: vi.fn(), cancelMyAppointment: vi.fn() }))

function renderDashboard() {
  render(
    <MemoryRouter initialEntries={['/client/dashboard']}>
      <Routes>
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/search" element={<p>shops list</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  listTenants.mockResolvedValue([{ id: 'tenant-1', slug: 'shop', name: 'Shop', address: 'Main St' }])
})

describe('customer bookings page', () => {
  it('has a Book button linking to the shops list when the customer has bookings', async () => {
    getMyAppointments.mockResolvedValue([
      { id: 1, serviceId: 1, status: 'CONFIRMED', startTime: '2099-01-05T14:00:00', endTime: '2099-01-05T14:30:00' },
    ])
    renderDashboard()

    const book = await screen.findByRole('link', { name: 'Book' })
    expect(book).toHaveAttribute('href', '/search')
    expect(screen.getByText('Calendar')).toBeInTheDocument()
  })

  it('shows only the Find a shop link when there are no bookings', async () => {
    getMyAppointments.mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByRole('link', { name: 'Find a shop' })).toHaveAttribute('href', '/search')
    expect(screen.queryByRole('link', { name: 'Book' })).not.toBeInTheDocument()
  })
})
