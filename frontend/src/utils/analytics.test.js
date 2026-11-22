import { describe, expect, it } from 'vitest'
import { addDays, bestMonth, computeAnalytics, currentMonthKey, mondayOf, monthlyBuckets, monthRange, shiftMonth, weekRange, yearRange } from './analytics'

const services = [
  { id: 1, name: 'Cut', price: '20.00' },
  { id: 2, name: 'Beard', price: '10.50' },
]

function booking(id, serviceId, startTime, status = 'CONFIRMED', clientPhone = '111', clientName = 'Ann') {
  return { id, serviceId, startTime, status, clientPhone, clientName }
}

const now = new Date(2026, 10, 15, 12, 0, 0)
const november = monthRange('2026-11')

describe('computeAnalytics revenue', () => {
  it('splits confirmed from pending revenue and ignores cancelled and out-of-range bookings', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-11-03T10:00:00', 'CONFIRMED'),
      booking(2, 2, '2026-11-20T10:00:00', 'PENDING', '222', 'Bob'),
      booking(3, 1, '2026-11-21T10:00:00', 'CANCELLED', '333', 'Cy'),
      booking(4, 1, '2026-10-30T10:00:00', 'CONFIRMED'),
    ], services, november, now)
    expect(result.confirmedRevenue).toBe(20)
    expect(result.pendingRevenue).toBe(10.5)
    expect(result.expectedRevenue).toBe(30.5)
    expect(result.bookings).toBe(2)
    expect(result.pendingBookings).toBe(1)
    expect(result.confirmedBookings).toBe(1)
  })

  it('counts earned revenue only for confirmed bookings that already started', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-11-03T10:00:00', 'CONFIRMED'),
      booking(2, 1, '2026-11-20T10:00:00', 'CONFIRMED', '222', 'Bob'),
      booking(3, 2, '2026-11-04T10:00:00', 'PENDING', '333', 'Cy'),
    ], services, november, now)
    expect(result.earnedRevenue).toBe(20)
    expect(result.expectedRevenue).toBe(50.5)
  })

  it('returns zeros for an empty range', () => {
    expect(computeAnalytics([], services, november, now)).toMatchObject({ expectedRevenue: 0, bookings: 0, clients: 0, byService: [] })
  })
})

describe('computeAnalytics clients', () => {
  it('counts a client with two bookings in the same month as repeat, matching phones by digits', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-11-02T10:00:00', 'CONFIRMED', '+39 111', 'Ann'),
      booking(2, 1, '2026-11-09T10:00:00', 'CONFIRMED', '39111', 'Ann B'),
      booking(3, 1, '2026-11-05T10:00:00', 'PENDING', '222', 'Bob'),
    ], services, november, now)
    expect(result.clients).toBe(2)
    expect(result.repeatClients).toBe(1)
    expect(result.firstTimeClients).toBe(1)
  })

  it('counts a client with an earlier booking as repeat but ignores bookings after the range', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-10-02T10:00:00', 'CONFIRMED', '111', 'Ann'),
      booking(2, 1, '2026-11-02T10:00:00', 'CONFIRMED', '111', 'Ann'),
      booking(3, 1, '2026-11-03T10:00:00', 'CONFIRMED', '222', 'Bob'),
      booking(4, 1, '2026-12-03T10:00:00', 'CONFIRMED', '222', 'Bob'),
    ], services, november, now)
    expect(result.repeatClients).toBe(1)
    expect(result.firstTimeClients).toBe(1)
    expect(result.allTimeClients).toBe(2)
  })

  it('does not count a client whose only bookings were cancelled', () => {
    const result = computeAnalytics([booking(1, 1, '2026-11-02T10:00:00', 'CANCELLED')], services, november, now)
    expect(result.clients).toBe(0)
    expect(result.allTimeClients).toBe(0)
  })
})

describe('computeAnalytics daily and services', () => {
  it('builds one daily entry per day of the month with confirmed and pending split', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-02-03T10:00:00'),
      booking(2, 2, '2026-02-03T11:00:00', 'PENDING', '222', 'Bob'),
    ], services, monthRange('2026-02'), now)
    expect(result.daily).toHaveLength(28)
    expect(result.daily[2]).toEqual({
      date: '2026-02-03', day: 3, confirmedRevenue: 20, pendingRevenue: 10.5, confirmedAppointments: 1, pendingAppointments: 1,
    })
    expect(result.daily[0]).toMatchObject({ day: 1, confirmedRevenue: 0, pendingRevenue: 0 })
  })

  it('limits a week range to its seven days', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-11-16T10:00:00'),
      booking(2, 1, '2026-11-22T10:00:00', 'PENDING', '222', 'Bob'),
      booking(3, 1, '2026-11-23T10:00:00', 'CONFIRMED', '333', 'Cy'),
    ], services, weekRange('2026-11-16'), now)
    expect(result.daily).toHaveLength(7)
    expect(result.bookings).toBe(2)
    expect(result.daily[6]).toMatchObject({ date: '2026-11-22', pendingAppointments: 1 })
  })

  it('groups by service sorted by revenue, keeping deleted services with no name and no revenue', () => {
    const result = computeAnalytics([
      booking(1, 2, '2026-11-03T10:00:00'),
      booking(2, 1, '2026-11-04T10:00:00', 'CONFIRMED', '222', 'Bob'),
      booking(3, 1, '2026-11-05T10:00:00', 'CONFIRMED', '333', 'Cy'),
      booking(4, 99, '2026-11-06T10:00:00', 'CONFIRMED', '444', 'Di'),
    ], services, november, now)
    expect(result.byService.map(row => row.name)).toEqual(['Cut', 'Beard', null])
    expect(result.byService[0]).toMatchObject({ bookings: 2, revenue: 40 })
    expect(result.byService[2]).toMatchObject({ serviceId: 99, bookings: 1, revenue: 0 })
  })
})

describe('date helpers', () => {
  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('formats the current month key', () => {
    expect(currentMonthKey(new Date(2026, 10, 22))).toBe('2026-11')
  })

  it('finds the Monday of the week, including for a Sunday', () => {
    expect(mondayOf(new Date(2026, 10, 22))).toBe('2026-11-16')
    expect(mondayOf(new Date(2026, 10, 23))).toBe('2026-11-23')
  })

  it('adds days across month ends', () => {
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('year view', () => {
  it('uses 365 days, or 366 in a leap year', () => {
    expect(yearRange(2026).days).toBe(365)
    expect(yearRange(2028).days).toBe(366)
    expect(yearRange(1900).days).toBe(365)
    expect(yearRange(2000).days).toBe(366)
  })

  it('groups the days of a year into twelve monthly buckets and finds the best month', () => {
    const result = computeAnalytics([
      booking(1, 1, '2026-01-10T10:00:00'),
      booking(2, 1, '2026-03-05T10:00:00', 'CONFIRMED', '222', 'Bob'),
      booking(3, 2, '2026-03-06T10:00:00', 'PENDING', '333', 'Cy'),
      booking(4, 1, '2027-03-06T10:00:00', 'CONFIRMED', '444', 'Di'),
    ], services, yearRange(2026), now)
    const months = monthlyBuckets(result.daily)
    expect(months).toHaveLength(12)
    expect(months[0]).toMatchObject({ date: '2026-01-01', confirmedRevenue: 20 })
    expect(months[2]).toMatchObject({ date: '2026-03-01', confirmedRevenue: 20, pendingRevenue: 10.5, confirmedAppointments: 1, pendingAppointments: 1 })
    expect(result.bookings).toBe(3)
    expect(bestMonth(months)).toEqual({ date: '2026-03-01', revenue: 30.5 })
  })

  it('has no best month when nothing earned', () => {
    expect(bestMonth(monthlyBuckets(computeAnalytics([], services, yearRange(2026), now).daily))).toBeNull()
  })
})
