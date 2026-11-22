import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppointmentList from './AppointmentList'

const appointments = [{
  id: 1, clientName: 'Ann', serviceId: 1, status: 'CONFIRMED',
  startTime: '2026-11-05T14:00:00', endTime: '2026-11-05T14:30:00',
}]

function renderList(props) {
  return render(<AppointmentList appointments={appointments} serviceNames={{ 1: 'Cut' }} onApprove={() => {}} onCancel={() => {}} {...props} />)
}

describe('appointment date display', () => {
  it('shows only the hour when the date is already shown above', () => {
    renderList({ showDate: false })
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nov/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/2:00|14:00/).length).toBeGreaterThan(0)
  })

  it('shows the date by default', () => {
    renderList({})
    expect(screen.getAllByText(/Nov/).length).toBeGreaterThan(0)
  })
})
