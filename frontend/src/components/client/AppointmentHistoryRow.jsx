const STATUS_STYLES = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function AppointmentHistoryRow({ appointment, onCancel }) {
  const start = new Date(appointment.startTime)
  const formatted = start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const isFuture = start > new Date()
  const canCancel = appointment.status !== 'CANCELLED' && isFuture

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-4 text-sm text-gray-600">#{appointment.serviceId}</td>
      <td className="py-3 pr-4 text-sm text-gray-600">{formatted}</td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[appointment.status] ?? ''}`}>
          {appointment.status}
        </span>
      </td>
      <td className="py-3">
        {canCancel && (
          <button
            onClick={() => onCancel(appointment.id)}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  )
}
