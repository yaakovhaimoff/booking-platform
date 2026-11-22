import { describe, expect, it } from 'vitest'
import { computeAnalytics, currentMonthKey, shiftMonth } from './analytics'

const services = [
  { id: 1, name: 'Cut', price: '20.00' },
  { id: 2, name: 'Beard', price: '10.50' },
]

function booking(id, serviceId, startTime, status = 'CONFIRMED', clientPhone = '111', clientName = 'Ann') {
  return { id, serviceId, startTime, status, clientPhone, clientName }
}

const now = new Date(2026, 10, 15, 12, 0, 0)

describe('computeAnalytics', () => {
  it('sums expected revenue of confirmed and pending bookings in the month and ignores cancelled ones', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-11-03T10:00:00', 'CONFIRMED'),
      booking(2, 2, '2026-11-20T10:00:00', 'PENDING', '222', 'Bob'),
      booking(3, 1, '2026-11-21T10:00:00', 'CANCELLED', '333', 'Cy'),
      booking(4, 1, '2026-10-30T10:00:00', 'CONFIRMED'),
    ], services, '2026-11', now)
    expect(result.expectedRevenue).toBe(30.5)
    expect(result.bookings).toBe(2)
  })

  it('counts earned revenue only for confirmed bookings that already started', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-11-03T10:00:00', 'CONFIRMED'),
      booking(2, 1, '2026-11-20T10:00:00', 'CONFIRMED', '222', 'Bob'),
      booking(3, 2, '2026-11-04T10:00:00', 'PENDING', '333', 'Cy'),
    ], services, '2026-11', now)
    expect(result.earnedRevenue).toBe(20)
    expect(result.expectedRevenue).toBe(50.5)
  })

  it('counts unique clients by phone digits, splitting new from returning', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-10-02T10:00:00', 'CONFIRMED', '+39 111', 'Ann'),
      booking(2, 1, '2026-11-02T10:00:00', 'CONFIRMED', '39111', 'Ann B'),
      booking(3, 1, '2026-11-05T10:00:00', 'PENDING', '222', 'Bob'),
      booking(4, 1, '2026-11-06T10:00:00', 'PENDING', '222', 'Bob'),
    ], services, '2026-11', now)
    expect(result.clients).toBe(2)
    expect(result.newClients).toBe(1)
    expect(result.returningClients).toBe(1)
    expect(result.allTimeClients).toBe(2)
  })

  it('does not count a client whose only bookings were cancelled', () => {
    const result = computeAnalytics([booking(1, 1, '2026-11-02T10:00:00', 'CANCELLED')], services, '2026-11', now)
    expect(result.clients).toBe(0)
    expect(result.allTimeClients).toBe(0)
  })

  it('builds one daily entry per day of the month with revenue and appointment counts', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-02-03T10:00:00'),
      booking(2, 2, '2026-02-03T11:00:00', 'PENDING', '222', 'Bob'),
    ], services, '2026-02', now)
    expect(result.daily).toHaveLength(28)
    expect(result.daily[2]).toEqual({ day: 3, revenue: 30.5, appointments: 2 })
    expect(result.daily[0]).toEqual({ day: 1, revenue: 0, appointments: 0 })
  })

  it('groups by service sorted by revenue, keeping bookings of deleted services with no name and no revenue', () => {
    const result = computeAnalytics([
      booking(1, 2, '2026-11-03T10:00:00'),
      booking(2, 1, '2026-11-04T10:00:00', 'CONFIRMED', '222', 'Bob'),
      booking(3, 1, '2026-11-05T10:00:00', 'CONFIRMED', '333', 'Cy'),
      booking(4, 99, '2026-11-06T10:00:00', 'CONFIRMED', '444', 'Di'),
    ], services, '2026-11', now)
    expect(result.byService.map(row => row.name)).toEqual(['Cut', 'Beard', null])
    expect(result.byService[0]).toMatchObject({ bookings: 2, revenue: 40 })
    expect(result.byService[2]).toMatchObject({ serviceId: 99, bookings: 1, revenue: 0 })
  })

  it('returns zeros for an empty month', () => {
    const result = computeAnalytics([], services, '2026-11', now)
    expect(result).toMatchObject({ expectedRevenue: 0, bookings: 0, clients: 0, byService: [] })
  })
})

describe('month helpers', () => {
  it('shifts across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('formats the current month key', () => {
    expect(currentMonthKey(new Date(2026, 10, 22))).toBe('2026-11')
  })
})
