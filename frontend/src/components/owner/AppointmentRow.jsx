export default function AppointmentRow({ appointment, onApprove, onCancel }) {
  const start = new Date(appointment.startTime)
  const formatted = start.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-4 text-sm text-gray-800">{appointment.clientName}</td>
      <td className="py-3 pr-4 text-sm text-gray-600">#{appointment.serviceId}</td>
      <td className="py-3 pr-4 text-sm text-gray-600">{formatted}</td>
      <td className="py-3 flex gap-2">
        <button
          onClick={() => onApprove(appointment.id)}
          className="px-3 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition"
        >
          Approve
        </button>
        <button
          onClick={() => onCancel(appointment.id)}
          className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
        >
          Cancel
        </button>
      </td>
    </tr>
  )
}
