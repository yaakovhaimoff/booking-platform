import { useI18n } from '../i18n'
import { buildIcsContent, downloadIcsFile } from '../calendarFile'

function splitIso(iso) {
  const [date, time] = iso.split('T')
  return { date, time: time.substring(0, 5) }
}

function waNumber(v) {
  const d = (v || '').replace(/[^\d]/g, '')
  return d.startsWith('0') ? '972' + d.slice(1) : d
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 text-right">{children}</dd>
    </div>
  )
}

export default function ConfirmationScreen({ appointment, service, tenant, onBookAnother }) {
  const { t, fmtDate, fmtPrice } = useI18n()
  const start = splitIso(appointment.startTime)
  const end = splitIso(appointment.endTime)
  const shopName = tenant.name || tenant.slug
  const wa = waNumber(tenant.whatsappNumber)
  const confirmed = appointment.status === 'CONFIRMED'

  const icsContent = buildIcsContent({
    uid: appointment.id,
    title: t('icsTitle', { service: service.name, shop: shopName }),
    start: appointment.startTime,
    end: appointment.endTime,
    location: tenant.address,
    description: shopName,
  })

  const waText = t('waMessage', { name: appointment.clientName, service: service.name, date: fmtDate(start.date), time: start.time })
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waText)}` : null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className={`w-12 h-12 ${confirmed ? 'bg-green-100' : 'bg-amber-100'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
          <svg className={`w-6 h-6 ${confirmed ? 'text-green-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={confirmed ? 'M5 13l4 4L19 7' : 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">{t(confirmed ? 'bookingConfirmed' : 'requestSent')}</h2>
        <span className={`inline-block mt-2 ${confirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} text-xs font-semibold px-2.5 py-1 rounded-full`}>
          {t(confirmed ? 'confirmedBadge' : 'waiting')}
        </span>
        <p className="text-sm text-gray-500 mt-3">{t(confirmed ? 'seeYouSoon' : 'willConfirm', { shop: shopName })}</p>
      </div>

      <dl className="space-y-3 mb-6 border-t border-gray-100 pt-5">
        <Row label={t('serviceLabel').replace(':', '')}>{service.name}</Row>
        <Row label={t('date')}>{fmtDate(start.date)}</Row>
        <Row label={t('time')}>{start.time} – {end.time}</Row>
        <Row label={t('duration')}>{service.durationMinutes} {t('min')}</Row>
        <Row label={t('price')}>{fmtPrice(service.price, tenant.currency)}</Row>
        <Row label={t('name')}>{appointment.clientName}</Row>
        <Row label={t('phoneLabel')}>{appointment.clientPhone}</Row>
        <Row label={t('bookingRef')}>#{String(appointment.id).padStart(5, '0')}</Row>
        {appointment.notes && <Row label={t('notes')}>{appointment.notes}</Row>}
      </dl>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => downloadIcsFile(icsContent)}
          className="text-center border border-gray-300 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-50 transition-colors"
        >
          {t('addToCalendar')}
        </button>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-green-500 text-white rounded-md py-2 font-medium hover:bg-green-600 transition-colors"
          >
            {t('messageOnWhatsApp', { shop: shopName })}
          </a>
        )}
        <button
          onClick={onBookAnother}
          className="bg-cta-600 text-white rounded-md py-2 font-medium hover:bg-cta-700 transition-colors"
        >
          {t('bookAnother')}
        </button>
      </div>
    </div>
  )
}
