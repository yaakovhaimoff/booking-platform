// Business analytics derived from bookings. Cancelled bookings never count. A booking's value is the
// current price of its service; bookings whose service was deleted count as bookings but earn nothing.

export function clientKey(appointment) {
  const phone = (appointment.clientPhone || '').replace(/\D/g, '')
  return phone || (appointment.clientName || '').trim().toLowerCase()
}

export function monthKeyOf(isoDateTime) {
  return isoDateTime.slice(0, 7)
}

export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  const shifted = new Date(year, month - 1 + delta, 1)
  return currentMonthKey(shifted)
}

function daysInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export function computeAnalytics(appointments, services, monthKey, now = new Date()) {
  const priceByService = new Map(services.map(service => [service.id, Number(service.price) || 0]))
  const nameByService = new Map(services.map(service => [service.id, service.name]))
  const active = appointments.filter(appointment => appointment.status !== 'CANCELLED')
  const inMonth = active.filter(appointment => monthKeyOf(appointment.startTime) === monthKey)
  const valueOf = appointment => priceByService.get(appointment.serviceId) ?? 0

  const daily = Array.from({ length: daysInMonth(monthKey) }, (_, index) => ({ day: index + 1, revenue: 0, appointments: 0 }))
  const byServiceId = new Map()
  let expectedRevenue = 0
  let earnedRevenue = 0

  for (const appointment of inMonth) {
    const value = valueOf(appointment)
    expectedRevenue += value
    if (appointment.status === 'CONFIRMED' && new Date(appointment.startTime) <= now) earnedRevenue += value
    const bucket = daily[Number(appointment.startTime.slice(8, 10)) - 1]
    bucket.revenue += value
    bucket.appointments += 1
    const entry = byServiceId.get(appointment.serviceId)
      || { serviceId: appointment.serviceId, name: nameByService.get(appointment.serviceId) ?? null, bookings: 0, revenue: 0 }
    entry.bookings += 1
    entry.revenue += value
    byServiceId.set(appointment.serviceId, entry)
  }

  const firstBookingMonthByClient = new Map()
  for (const appointment of active) {
    const key = clientKey(appointment)
    if (!key) continue
    const month = monthKeyOf(appointment.startTime)
    const known = firstBookingMonthByClient.get(key)
    if (known === undefined || month < known) firstBookingMonthByClient.set(key, month)
  }
  const clientsThisMonth = new Set(inMonth.map(clientKey).filter(Boolean))
  const newClients = [...clientsThisMonth].filter(key => firstBookingMonthByClient.get(key) === monthKey).length

  return {
    expectedRevenue,
    earnedRevenue,
    bookings: inMonth.length,
    clients: clientsThisMonth.size,
    newClients,
    returningClients: clientsThisMonth.size - newClients,
    allTimeClients: firstBookingMonthByClient.size,
    daily,
    byService: [...byServiceId.values()].sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings),
  }
}
