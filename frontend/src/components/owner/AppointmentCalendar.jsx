import { useState, useMemo } from 'react'
import AppointmentList from './AppointmentList'
import { useI18n } from '../../i18n'

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const GROUPS = ['PENDING', 'CONFIRMED']

// Month calendar: every day shows its total bookings (pending + confirmed). Clicking a day lists
// that day's bookings grouped by status. `appointments` must already exclude cancelled ones.
export default function AppointmentCalendar({ appointments, serviceNames, onApprove, onCancel }) {
  const { t, locale, weekStart, weekdays } = useI18n()
  const now = new Date()
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(todayIso)

  // startTime is a local ISO string: first 10 chars are the date
  const byDate = useMemo(() => {
    const map = {}
    for (const a of appointments) {
      const key = a.startTime.substring(0, 10)
      ;(map[key] ||= []).push(a)
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return map
  }, [appointments])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() - weekStart + 7) % 7
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function shift(delta) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const dayList = byDate[selected] || []
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="grid lg:grid-cols-[22rem_1fr] gap-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shift(-1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" aria-label={t('prevMonth')}>←</button>
          <h3 className="font-semibold text-gray-800">
            {new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => shift(1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" aria-label={t('nextMonth')}>→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
          {weekdays.map(w => <div key={w}>{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />
            const date = iso(year, month, day)
            const list = byDate[date] || []
            const count = list.length
            const hasPending = list.some(a => a.status === 'PENDING')
            const isSelected = date === selected
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                aria-pressed={isSelected}
                className={`relative aspect-square rounded-md text-sm transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : count > 0
                      ? 'bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100'
                      : 'text-gray-500 hover:bg-gray-100'
                } ${date === todayIso && !isSelected ? 'ring-1 ring-indigo-300' : ''}`}
              >
                {day}
                {count > 0 && (
                  <span className={`absolute top-0.5 right-1 text-[10px] leading-none font-bold ${isSelected ? 'text-indigo-100' : 'text-indigo-500'}`}>
                    {count}
                  </span>
                )}
                {hasPending && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="mb-3 text-base font-semibold text-gray-900 capitalize">{selectedLabel}</h3>
        {dayList.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noBookingsOnDay')}</p>
        ) : (
          <div className="flex flex-col gap-5">
            {GROUPS.map(status => {
              const group = dayList.filter(a => a.status === status)
              if (group.length === 0) return null
              return (
                <section key={status}>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t('status_' + status)} · {group.length}
                  </h4>
                  <AppointmentList
                    appointments={group}
                    serviceNames={serviceNames}
                    onApprove={onApprove}
                    onCancel={onCancel}
                    showHeader={false}
                  />
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
