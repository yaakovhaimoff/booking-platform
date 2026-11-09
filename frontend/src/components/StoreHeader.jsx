import { useState } from 'react'
import { useI18n } from '../i18n'
import { todayStatus } from '../utils/openStatus'

function digits(v) {
  return (v || '').replace(/[^\d]/g, '')
}

// Israeli-friendly: 05x... -> 9725x...
function waNumber(v) {
  const d = digits(v)
  return d.startsWith('0') ? '972' + d.slice(1) : d
}

function ActionButton({ href, label, color, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1.5 group"
    >
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition group-hover:scale-105 ${color}`}>
        {children}
      </span>
      <span className="text-xs text-gray-600">{label}</span>
    </a>
  )
}

// Fallback cover when the store has no cover image: a gradient picked from the store name, stable per store.
const COVER_GRADIENTS = [
  ['#4f46e5', '#7c3aed'], ['#0f766e', '#0891b2'], ['#be123c', '#ea580c'],
  ['#1d4ed8', '#0ea5e9'], ['#4d7c0f', '#0d9488'], ['#6d28d9', '#db2777'],
]
function coverGradient(seed) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const [a, b] = COVER_GRADIENTS[h % COVER_GRADIENTS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function Rating({ rating }) {
  const { t } = useI18n()
  if (!rating || rating.count === 0) return null
  return (
    <a href="#reviews" className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
      <span className="text-amber-400" aria-hidden="true">★</span>
      <span className="font-semibold text-gray-900">{rating.average.toFixed(1)}</span>
      <span>({t('reviewCount', { n: rating.count })})</span>
    </a>
  )
}

export default function StoreHeader({ tenant, hours = null, compact = false, rating = null }) {
  const { t } = useI18n()
  const { name, slug, address, phone, whatsappNumber, logoUrl, coverUrl } = tenant
  const title = name || slug
  const wa = waNumber(whatsappNumber)
  // Use the cover link when there is one and it loads; otherwise fall back to a colour.
  const [coverFailed, setCoverFailed] = useState(false)
  const cover = coverUrl && !coverFailed ? coverUrl : null
  const status = hours ? todayStatus(hours) : null
  const tel = phone ? phone.replace(/[^\d+]/g, '') : ''

  if (compact) {
    return (
      <div className="bg-white sm:rounded-2xl shadow-sm mb-4 px-4 py-3 flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{title}</p>
          {address && <p className="text-xs text-gray-500 truncate">{address}</p>}
        </div>
        {rating && rating.count > 0 && (
          <p className="ml-auto shrink-0 text-sm text-gray-700"><span className="text-amber-400">★</span> <span className="font-semibold">{rating.average.toFixed(1)}</span></p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white sm:rounded-2xl shadow-sm overflow-hidden mb-6">
      <div
        className="relative h-36 sm:h-44 lg:h-64"
        style={{ background: coverGradient(title) }}
      >
        {cover && (
          <img src={cover} alt="" onError={() => setCoverFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="px-5 pb-5 text-center lg:text-left lg:px-8 lg:pb-6 lg:flex lg:items-end lg:gap-6">
        <div className="relative z-10 -mt-12 mb-3 flex justify-center lg:mb-0 lg:-mt-14 lg:shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${title} logo`}
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white object-cover bg-white shadow"
            />
          ) : (
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 text-3xl font-bold flex items-center justify-center shadow">
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="lg:flex-1 lg:min-w-0 lg:pt-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
          {address && <p className="text-sm text-gray-500 mt-1">{address}</p>}
          <Rating rating={rating} />
          {status && (
            <p className={`mt-3 flex lg:inline-flex w-fit mx-auto lg:mx-0 items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${status.open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              <span className={`w-2 h-2 rounded-full ${status.open ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden="true" />
              {t(status.key, { time: status.time })}
            </p>
          )}
        </div>

        {(wa || tel || address) && (
          <div className="flex justify-center gap-6 mt-5 lg:mt-0 lg:justify-end lg:shrink-0">
            {wa && (
              <ActionButton href={`https://wa.me/${wa}`} label={t('whatsapp')} color="bg-green-500">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.200-3.500-8.500zM12 22c-1.800 0-3.600-.5-5.100-1.400l-.4-.2-3.700 1 1-3.600-.2-.4A10 10 0 1 1 12 22zm5.500-7.500c-.3-.2-1.800-.9-2-1-.3-.1-.5-.2-.7.2-.2.300-.8 1-.9 1.200-.2.200-.3.200-.6.100-.3-.2-1.300-.5-2.400-1.500-.9-.8-1.500-1.800-1.700-2.100-.2-.3 0-.5.100-.6l.4-.5c.1-.2.2-.3.300-.5.100-.2 0-.4 0-.5l-.9-2.200c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400-.3.300-1 1-1 2.500s1.100 2.900 1.200 3.100c.2.200 2.100 3.200 5.100 4.500.7.3 1.300.5 1.700.6.700.2 1.400.2 1.900.1.600-.1 1.800-.7 2-1.400.3-.7.300-1.300.2-1.400-.1-.1-.3-.2-.6-.4z"/></svg>
              </ActionButton>
            )}
            {tel && (
              <ActionButton href={`tel:${tel}`} label={t('call')} color="bg-indigo-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.600 10.800a15 15 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.25c1.100.4 2.300.6 3.600.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.300.2 2.500.6 3.600a1 1 0 0 1-.25 1z"/></svg>
              </ActionButton>
            )}
            {address && (
              <ActionButton
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                label={t('maps')}
                color="bg-sky-500"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.200 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/></svg>
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
