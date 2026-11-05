import { useI18n } from '../i18n'

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
      <span className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm transition group-hover:scale-105 ${color}`}>
        {children}
      </span>
      <span className="text-xs text-gray-600">{label}</span>
    </a>
  )
}

export default function StoreHeader({ tenant }) {
  const { t } = useI18n()
  const { name, slug, address, phone, whatsappNumber, logoUrl, coverUrl } = tenant
  const title = name || slug
  const wa = waNumber(whatsappNumber)
  const tel = phone ? phone.replace(/[^\d+]/g, '') : ''

  return (
    <div className="bg-white sm:rounded-2xl shadow-sm overflow-hidden mb-6">
      <div
        className="h-36 sm:h-44 bg-gradient-to-br from-indigo-500 to-purple-600 bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      />
      <div className="px-5 pb-5 text-center">
        <div className="-mt-12 mb-3 flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${title} logo`}
              className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 text-3xl font-bold flex items-center justify-center shadow">
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {address && <p className="text-sm text-gray-500 mt-1">{address}</p>}

        {(wa || tel || address) && (
          <div className="flex justify-center gap-6 mt-5">
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
                href={`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`}
                label={t('waze')}
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
