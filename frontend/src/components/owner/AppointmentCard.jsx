import { useI18n } from '../../i18n'
import { STATUS_STYLES } from './statusStyles'

// Phone-friendly version of AppointmentRow: one card per appointment, big tap targets.
export default function AppointmentCard({ appointment, serviceName, onApprove, onCancel }) {
  const { t, locale } = useI18n()
  const start = new Date(appointment.startTime)
  const time = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const date = start.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  const { status } = appointment

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-gray-900 leading-none">{time}</div>
          <div className="text-xs text-gray-500 mt-1">{date}</div>
        </div>
        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[status] || ''}`}>
          {t('status_' + status)}
        </span>
      </div>

      <div className="mt-3">
        <div className="font-medium text-gray-900">{appointment.clientName}</div>
        <div className="text-sm text-gray-600">{serviceName || `#${appointment.serviceId}`}</div>
        {appointment.clientPhone && (
          <a href={`tel:${appointment.clientPhone}`} className="inline-block mt-1 text-sm text-indigo-600">
            {appointment.clientPhone}
          </a>
        )}
        {appointment.notes && (
          <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">“{appointment.notes}”</p>
        )}
      </div>

      {status !== 'CANCELLED' && (
        <div className="flex gap-3 mt-4">
          {status === 'PENDING' && (
            <button
              onClick={() => onApprove(appointment.id)}
              className="flex-1 py-3 text-sm font-semibold bg-green-600 text-white rounded-lg active:bg-green-700 transition"
            >
              {t('approve')}
            </button>
          )}
          <button
            onClick={() => onCancel(appointment.id)}
            className="flex-1 py-3 text-sm font-semibold border border-red-200 text-red-600 rounded-lg active:bg-red-50 transition"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
