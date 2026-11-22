import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppointmentQueueTab from './AppointmentQueueTab'
import { getAppointments, getServices } from '../../api/ownerApi'

vi.mock('../../auth', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token' }) }))
vi.mock('../../api/ownerApi', () => ({ getAppointments: vi.fn(), getServices: vi.fn(), updateAppointmentStatus: vi.fn() }))

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

const pendingRequest = id => ({
  id, serviceId: 1, status: 'PENDING', clientName: `Client ${id}`, clientPhone: `${id}`,
  startTime: '2099-01-05T14:00:00', endTime: '2099-01-05T14:30:00',
})

describe('pending requests banner', () => {
  it('shows how many requests wait and switches the list to pending on Review', async () => {
    getAppointments.mockImplementation((token, tenantId, status) => Promise.resolve(status === 'CANCELLED' ? [] : [pendingRequest(1), pendingRequest(2)]))
    getServices.mockResolvedValue([{ id: 1, name: 'Cut', price: '20' }])
    render(<AppointmentQueueTab tenant={{ id: 7 }} pending={2} />)

    expect(await screen.findByText('2 requests waiting for your approval')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Review' }))
    expect(screen.getByRole('button', { name: 'Pending' }).className).toMatch(/text-brand-600/)
  })

  it('is hidden when nothing waits', async () => {
    getAppointments.mockResolvedValue([])
    getServices.mockResolvedValue([])
    render(<AppointmentQueueTab tenant={{ id: 7 }} pending={0} />)

    expect(await screen.findByText('No appointments today.')).toBeInTheDocument()
    expect(screen.queryByText(/waiting for your approval/)).not.toBeInTheDocument()
  })
})
