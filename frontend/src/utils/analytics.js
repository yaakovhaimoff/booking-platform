// Business analytics derived from bookings. Cancelled bookings never count. A booking's value is the
// current price of its service; bookings whose service was deleted count as bookings but earn nothing.
// A range is { from: 'YYYY-MM-DD', days: number }; dates are compared as text so no timezone shifts apply.

export function clientKey(appointment) {
  const phone = (appointment.clientPhone || '').replace(/\D/g, '')
  return phone || (appointment.clientName || '').trim().toLowerCase()
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseIsoDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(iso, amount) {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + amount)
  return isoDate(date)
}

export function currentMonthKey(now = new Date()) {
  return isoDate(now).slice(0, 7)
}

export function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  return currentMonthKey(new Date(year, month - 1 + delta, 1))
}

export function monthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return { from: `${monthKey}-01`, days: new Date(year, month, 0).getDate() }
}

export function yearRange(year) {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return { from: `${year}-01-01`, days: leap ? 366 : 365 }
}

export function monthlyBuckets(daily) {
  const byMonth = new Map()
  for (const entry of daily) {
    const key = entry.date.slice(0, 7)
    const bucket = byMonth.get(key)
      || { date: `${key}-01`, confirmedRevenue: 0, pendingRevenue: 0, confirmedAppointments: 0, pendingAppointments: 0 }
    bucket.confirmedRevenue += entry.confirmedRevenue
    bucket.pendingRevenue += entry.pendingRevenue
    bucket.confirmedAppointments += entry.confirmedAppointments
    bucket.pendingAppointments += entry.pendingAppointments
    byMonth.set(key, bucket)
  }
  return [...byMonth.values()]
}

export function bestMonth(buckets) {
  const best = buckets.reduce((top, bucket) => {
    const revenue = bucket.confirmedRevenue + bucket.pendingRevenue
    return revenue > top.revenue ? { date: bucket.date, revenue } : top
  }, { date: null, revenue: 0 })
  return best.date ? best : null
}

export function mondayOf(now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return isoDate(date)
}

export function weekRange(mondayIso) {
  return { from: mondayIso, days: 7 }
}

export function computeAnalytics(appointments, services, range, now = new Date()) {
  const priceByService = new Map(services.map(service => [service.id, Number(service.price) || 0]))
  const nameByService = new Map(services.map(service => [service.id, service.name]))
  const active = appointments.filter(appointment => appointment.status !== 'CANCELLED')
  const lastDay = addDays(range.from, range.days - 1)
  const dayOf = appointment => appointment.startTime.slice(0, 10)
  const inRange = active.filter(appointment => dayOf(appointment) >= range.from && dayOf(appointment) <= lastDay)
  const valueOf = appointment => priceByService.get(appointment.serviceId) ?? 0

  const daily = Array.from({ length: range.days }, (_, index) => {
    const date = addDays(range.from, index)
    return { date, day: Number(date.slice(8, 10)), confirmedRevenue: 0, pendingRevenue: 0, confirmedAppointments: 0, pendingAppointments: 0 }
  })
  const dailyByDate = new Map(daily.map(entry => [entry.date, entry]))
  const byServiceId = new Map()
  let confirmedRevenue = 0
  let pendingRevenue = 0
  let earnedRevenue = 0
  let pendingBookings = 0

  for (const appointment of inRange) {
    const value = valueOf(appointment)
    const confirmed = appointment.status === 'CONFIRMED'
    const bucket = dailyByDate.get(dayOf(appointment))
    if (confirmed) {
      confirmedRevenue += value
      bucket.confirmedRevenue += value
      bucket.confirmedAppointments += 1
      if (new Date(appointment.startTime) <= now) earnedRevenue += value
    } else {
      pendingRevenue += value
      pendingBookings += 1
      bucket.pendingRevenue += value
      bucket.pendingAppointments += 1
    }
    const entry = byServiceId.get(appointment.serviceId)
      || { serviceId: appointment.serviceId, name: nameByService.get(appointment.serviceId) ?? null, bookings: 0, revenue: 0 }
    entry.bookings += 1
    entry.revenue += value
    byServiceId.set(appointment.serviceId, entry)
  }

  const bookingsByClient = new Map()
  for (const appointment of active) {
    const key = clientKey(appointment)
    if (key && dayOf(appointment) <= lastDay) bookingsByClient.set(key, (bookingsByClient.get(key) || 0) + 1)
  }
  const clientsInRange = new Set(inRange.map(clientKey).filter(Boolean))
  const repeatClients = [...clientsInRange].filter(key => bookingsByClient.get(key) >= 2).length

  return {
    expectedRevenue: confirmedRevenue + pendingRevenue,
    confirmedRevenue,
    pendingRevenue,
    earnedRevenue,
    bookings: inRange.length,
    pendingBookings,
    confirmedBookings: inRange.length - pendingBookings,
    clients: clientsInRange.size,
    firstTimeClients: clientsInRange.size - repeatClients,
    repeatClients,
    allTimeClients: new Set(active.map(clientKey).filter(Boolean)).size,
    daily,
    byService: [...byServiceId.values()].sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings),
  }
}
