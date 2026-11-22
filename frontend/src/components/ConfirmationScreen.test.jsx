import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmationScreen from './ConfirmationScreen'
import { buildIcsContent } from '../calendarFile'

const appointment = {
  id: 7, clientName: 'Ann', clientPhone: '123456',
  startTime: '2026-11-05T14:00:00', endTime: '2026-11-05T14:30:00',
}
const service = { name: 'Haircut', durationMinutes: 30, price: 20 }
const tenant = { name: 'Shop', slug: 'shop', currency: 'EUR', address: 'Main St, Rome' }

afterEach(() => vi.restoreAllMocks())

describe('buildIcsContent', () => {
  it('writes floating local start and end times', () => {
    const content = buildIcsContent({ uid: 7, title: 'Cut', start: '2026-11-05T14:00:00', end: '2026-11-05T14:30:00' })
    expect(content).toContain('DTSTART:20261105T140000')
    expect(content).toContain('DTEND:20261105T143000')
    expect(content).toContain('UID:7@booking')
  })

  it('pads times that arrive without seconds', () => {
    const content = buildIcsContent({ uid: 1, title: 'Cut', start: '2026-11-05T14:00', end: '2026-11-05T14:30' })
    expect(content).toContain('DTSTART:20261105T140000')
  })

  it('escapes commas in the location', () => {
    const content = buildIcsContent({ uid: 1, title: 'Cut', start: '2026-11-05T14:00:00', end: '2026-11-05T14:30:00', location: 'Main St, Rome' })
    expect(content).toContain('LOCATION:Main St\\, Rome')
  })
})

describe('add to calendar button', () => {
  it('downloads a text/calendar blob file instead of a data URL', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<ConfirmationScreen appointment={appointment} service={service} tenant={tenant} onBookAnother={() => {}} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(createObjectURL.mock.calls[0][0].type).toBe('text/calendar;charset=utf-8')
    expect(click).toHaveBeenCalledOnce()
  })
})
