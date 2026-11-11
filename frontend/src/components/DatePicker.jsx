import { useState, useEffect } from 'react'
import { getOpenDates } from '../api/bookingApi'
import { useI18n } from '../i18n'

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function DatePicker({ serviceId, onSelect }) {
  const { t, locale } = useI18n()
  // Weeks always start on Monday
  const weekStart = 1
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + ((i + weekStart) % 7)).toLocaleDateString(locale, { weekday: 'short' }))
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [loaded, setLoaded] = useState({ key: null, dates: new Set(), failed: false })
  const [attempt, setAttempt] = useState(0)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() - weekStart + 7) % 7
  const monthKey = `${year}-${month}`
  const loading = loaded.key !== monthKey
  const openDates = loaded.dates
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => {
    let cancelled = false
    const done = (dates, failed = false) => { if (!cancelled) setLoaded({ key: monthKey, dates: new Set(dates), failed }) }
    getOpenDates(iso(year, month, 1), iso(year, month, daysInMonth), serviceId).then(d => done(d)).catch(() => done([], true))
    return () => { cancelled = true }
  }, [year, month, daysInMonth, monthKey, attempt, serviceId])

  function shift(delta) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => shift(-1)}
          disabled={isCurrentMonth}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label={t('prevMonth')}
        >
          ←
        </button>
        <h3 className="font-semibold text-gray-800">
          {new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => shift(1)}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
          aria-label={t('nextMonth')}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {weekdays.map(w => <div key={w}>{w}</div>)}
      </div>

      {loading && <p className="text-sm text-indigo-600 text-center mb-2 animate-pulse" role="status">{t('checkingAvail')}</p>}
      {!loading && loaded.failed && (
        <p className="text-sm text-red-600 text-center mb-2">
          {t('timeoutError')}{' '}
          <button className="underline font-medium" onClick={() => { setLoaded(l => ({ ...l, key: null })); setAttempt(a => a + 1) }}>{t('retry')}</button>
        </p>
      )}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const date = iso(year, month, day)
          const open = !loading && openDates.has(date)
          // While loading, days look neutral (not "closed") so the calendar never appears fully booked.
          if (loading) {
            return <div key={date} className="aspect-square rounded-md bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-400">{day}</div>
          }
          return (
            <button
              key={date}
              disabled={!open}
              title={open ? undefined : t('closedDay')}
              onClick={() => onSelect(date)}
              className={`aspect-square rounded-md text-sm transition ${
                open
                  ? 'bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-600 hover:text-white'
                  : 'text-gray-300 cursor-not-allowed'
              } ${date === todayIso ? 'ring-1 ring-indigo-300' : ''}`}
            >
              {day}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">{t('availableHint')}</p>
    </div>
  )
}
