import { useI18n } from '../i18n'

const hhmm = v => (v || '').slice(0, 5)

// About blurb + a "visit us" card: map on top, address with directions, then the week's hours.
export default function StoreInfo({ tenant, hours }) {
  const { t, locale } = useI18n()
  const { about, address } = tenant
  const todayDow = (new Date().getDay() + 6) % 7 // 0 = Monday, same as the API

  const week = hours && hours.length
    ? Array.from({ length: 7 }, (_, dow) => {
        const row = hours.find(h => h.dayOfWeek === dow)
        const open = row && !row.isClosed && row.openTime && row.closeTime
        return {
          dow,
          label: new Date(2023, 0, 2 + dow).toLocaleDateString(locale, { weekday: 'long' }), // 2 Jan 2023 is a Monday
          text: open ? `${hhmm(row.openTime)} – ${hhmm(row.closeTime)}` : null,
        }
      })
    : null

  if (!about && !address && !week) return null
  const q = encodeURIComponent(address || '')

  return (
    <div className="flex flex-col gap-10 lg:gap-6 mt-10 lg:mt-0">
      {about && (
        <section aria-labelledby="about-title">
          <h2 id="about-title" className="text-lg font-semibold text-gray-900 mb-2">{t('about')}</h2>
          <p className="border-l-4 border-indigo-200 pl-4 text-gray-700 whitespace-pre-line break-words">{about}</p>
        </section>
      )}

      {(address || week) && (
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden" aria-labelledby="visit-title">
          {address && (
            <>
              <iframe
                title={t('mapOf', { address })}
                src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-48 sm:h-56 border-0 block"
              />
              <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-gray-100">
                <div className="min-w-0">
                  <h2 id="visit-title" className="text-sm font-semibold text-gray-900">{t('visitUs')}</h2>
                  <p className="text-sm text-gray-600 truncate">{address}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {t('getDirections')} →
                </a>
              </div>
            </>
          )}
          {week && (
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('openingHours')}</h3>
              <ul className="text-sm">
                {week.map(d => (
                  <li
                    key={d.dow}
                    className={`flex justify-between py-1.5 px-2 -mx-2 rounded-md ${d.dow === todayDow ? 'bg-indigo-50 font-semibold text-gray-900' : 'text-gray-600'}`}
                  >
                    <span className="capitalize">{d.label}{d.dow === todayDow && <span className="ml-2 text-xs font-medium text-indigo-600">{t('today')}</span>}</span>
                    <span>{d.text || t('closed')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
