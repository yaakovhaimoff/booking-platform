import { useState, useMemo } from 'react'
import AppointmentRow from './AppointmentRow'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function AppointmentCalendar({ appointments, serviceNames, onApprove, onCancel }) {
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
  const firstWeekday = new Date(year, month, 1).getDay()
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
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div className="max-w-md">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shift(-1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" aria-label="Previous month">←</button>
          <h3 className="font-semibold text-gray-800">
            {new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => shift(1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" aria-label="Next month">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
          {WEEKDAYS.map(w => <div key={w}>{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />
            const date = iso(year, month, day)
            const count = byDate[date]?.length || 0
            const isSelected = date === selected
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
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
                  <span className={`absolute top-0.5 right-1 text-[10px] leading-none ${isSelected ? 'text-indigo-100' : 'text-indigo-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-700">{selectedLabel}</h3>
      {dayList.length === 0 ? (
        <p className="text-sm text-gray-400">No confirmed appointments on this day.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <tbody>
              {dayList.map(a => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  serviceName={serviceNames[a.serviceId]}
                  onApprove={onApprove}
                  onCancel={onCancel}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
