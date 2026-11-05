import { useState, useEffect } from 'react'
import { getOpenDates } from '../api/bookingApi'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function DatePicker({ onSelect }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [loaded, setLoaded] = useState({ key: null, dates: new Set() })

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const monthKey = `${year}-${month}`
  const loading = loaded.key !== monthKey
  const openDates = loaded.dates
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => {
    let cancelled = false
    const done = dates => { if (!cancelled) setLoaded({ key: monthKey, dates: new Set(dates) }) }
    getOpenDates(iso(year, month, 1), iso(year, month, daysInMonth)).then(done).catch(() => done([]))
    return () => { cancelled = true }
  }, [year, month, daysInMonth, monthKey])

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
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="font-semibold text-gray-800">
          {new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => shift(1)}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {WEEKDAYS.map(w => <div key={w}>{w}</div>)}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const date = iso(year, month, day)
          const open = !loading && openDates.has(date)
          return (
            <button
              key={date}
              disabled={!open}
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
      <p className="text-xs text-gray-400 mt-3">Highlighted days have available times.</p>
    </div>
  )
}
