export default function HoursRowInput({ day, row, onChange }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="w-28 text-sm font-medium text-gray-700">{day}</span>

      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={row.isClosed}
          onChange={e => onChange(row.dayOfWeek, 'isClosed', e.target.checked)}
          className="rounded"
        />
        Closed
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        Open
        <input
          type="time"
          value={row.openTime || ''}
          disabled={row.isClosed}
          onChange={e => onChange(row.dayOfWeek, 'openTime', e.target.value || null)}
          className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        Close
        <input
          type="time"
          value={row.closeTime || ''}
          disabled={row.isClosed}
          onChange={e => onChange(row.dayOfWeek, 'closeTime', e.target.value || null)}
          className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </label>
    </div>
  )
}
