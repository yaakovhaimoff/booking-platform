// Operating hours rows: { dayOfWeek: 0 = Monday ... 6 = Sunday, openTime, closeTime, isClosed }.
const hhmm = v => (v || '').slice(0, 5)
const mins = v => { const [h, m] = hhmm(v).split(':').map(Number); return h * 60 + (m || 0) }
const dowOf = date => (date.getDay() + 6) % 7

// Row for a 'YYYY-MM-DD' date (local), or null when the shop has no hours / is closed that day.
export function hoursOnDate(hours, iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return openRow(hours, new Date(y, m - 1, d))
}

function openRow(hours, date) {
  const row = (hours || []).find(h => h.dayOfWeek === dowOf(date))
  if (!row || row.isClosed || !row.openTime || !row.closeTime) return null
  return { open: hhmm(row.openTime), close: hhmm(row.closeTime) }
}

// Status for today: { key, time, open } where key is an i18n key.
export function todayStatus(hours, now = new Date()) {
  const row = openRow(hours, now)
  if (!row) return { key: 'closedToday', open: false }
  const n = now.getHours() * 60 + now.getMinutes()
  if (n < mins(row.open)) return { key: 'opensAtToday', time: row.open, open: false }
  if (n >= mins(row.close)) return { key: 'closedAfter', time: row.close, open: false }
  return { key: 'openNowUntil', time: row.close, open: true }
}
