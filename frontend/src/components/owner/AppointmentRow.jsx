const STATUS_STYLES = {
  PENDING:   'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function AppointmentRow({ appointment, serviceName, onApprove, onCancel }) {
  const start = new Date(appointment.startTime)
  const formatted = start.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const { status } = appointment

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-4 text-sm text-gray-800">
        <div className="font-medium">{appointment.clientName}</div>
        {appointment.clientPhone && (
          <a href={`tel:${appointment.clientPhone}`} className="text-xs text-indigo-600 hover:underline">
            {appointment.clientPhone}
          </a>
        )}
      </td>
      <td className="py-3 pr-4 text-sm text-gray-600">{serviceName || `#${appointment.serviceId}`}</td>
      <td className="py-3 pr-4 text-sm text-gray-600">{formatted}</td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_STYLES[status] || ''}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          {status === 'PENDING' && (
            <button
              onClick={() => onApprove(appointment.id)}
              className="px-3 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition"
            >
              Approve
            </button>
          )}
          {status !== 'CANCELLED' && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
            >
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
