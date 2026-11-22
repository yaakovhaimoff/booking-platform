import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { downloadAppointmentCalendar } from '../../calendarFile'

const STATUS_STYLES = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

// Phone-friendly version of AppointmentHistoryRow: a table with five columns is clipped on a phone.
export default function AppointmentHistoryCard({ appointment, onCancel }) {
  const { t, locale } = useI18n()
  const start = new Date(appointment.startTime)
  const time = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const date = start.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  const isActive = appointment.status !== 'CANCELLED' && start > new Date()

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-gray-900 leading-none">{time}</div>
          <div className="text-xs text-gray-500 mt-1">{date}</div>
        </div>
        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[appointment.status] ?? ''}`}>
          {t('status_' + appointment.status)}
        </span>
      </div>

      <div className="mt-3 font-medium text-gray-900">
        {appointment.shopSlug
          ? <Link to={`/store/${appointment.shopSlug}`} className="hover:text-brand-600 hover:underline">{appointment.shopName}</Link>
          : (appointment.shopName ?? `#${appointment.serviceId}`)}
      </div>

      {isActive && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => downloadAppointmentCalendar(appointment)}
            className="flex-1 py-3 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg active:bg-gray-50 transition"
          >
            {t('addToCalendar')}
          </button>
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
