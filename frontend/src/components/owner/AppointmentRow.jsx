import { useI18n } from '../../i18n'
import { STATUS_STYLES } from './statusStyles'


export default function AppointmentRow({ appointment, serviceName, onApprove, onCancel }) {
  const { t, locale } = useI18n()
  const start = new Date(appointment.startTime)
  const formatted = start.toLocaleString(locale, {
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
        {appointment.notes && (
          <div className="text-xs text-gray-500 mt-1 max-w-xs whitespace-pre-wrap">“{appointment.notes}”</div>
        )}
      </td>
      <td className="py-3 pr-4 text-sm text-gray-600">{serviceName || `#${appointment.serviceId}`}</td>
      <td className="py-3 pr-4 text-sm text-gray-600">{formatted}</td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_STYLES[status] || ''}`}>
          {t('status_' + status)}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          {status === 'PENDING' && (
            <button
              onClick={() => onApprove(appointment.id)}
              className="px-3 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition"
            >
              {t('approve')}
            </button>
          )}
          {status !== 'CANCELLED' && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
