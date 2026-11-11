import { Fragment, useEffect, useMemo, useState } from 'react'
import { useAuth0 } from '../../auth'
import { getAppointments, getServices } from '../../api/ownerApi'
import { useI18n } from '../../i18n'
import { STATUS_STYLES } from './statusStyles'

// Clients are derived from bookings. Phone is the identity (bookings store a phone, not an email),
// so the same number under different names is one client. Name is the fallback when there is no phone.
export default function ClientsTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const { t, locale } = useI18n()
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAccessTokenSilently()
      .then(token => Promise.all([getAppointments(token, tenant.id, null), getServices(token, tenant.id).catch(() => [])]))
      .then(([a, s]) => { if (!cancelled) { setAppointments(a); setServices(s) } })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenant.id, getAccessTokenSilently])

  const serviceNames = useMemo(() => Object.fromEntries(services.map(s => [s.id, s.name])), [services])

  const clients = useMemo(() => {
    const byKey = new Map()
    for (const a of appointments) {
      const phone = (a.clientPhone || '').replace(/\D/g, '')
      const key = phone || (a.clientName || '').trim().toLowerCase()
      if (!key) continue
      const c = byKey.get(key) || { key, name: a.clientName, phone: a.clientPhone, bookings: [] }
      c.bookings.push(a)
      byKey.set(key, c)
    }
    return [...byKey.values()]
      .map(c => {
        const bookings = c.bookings.sort((x, y) => y.startTime.localeCompare(x.startTime)) // newest first
        return { ...c, bookings, name: bookings[0].clientName || c.name }
      })
      .sort((x, y) => y.bookings[0].startTime.localeCompare(x.bookings[0].startTime))
  }, [appointments])

  const q = query.trim().toLowerCase()
  const shown = q ? clients.filter(c => `${c.name || ''} ${c.phone || ''}`.toLowerCase().includes(q)) : clients
  const fmtDay = iso => new Date(iso).toLocaleDateString(locale, { dateStyle: 'medium' })
  const fmtTime = iso => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })

  if (loading) return <p className="text-sm text-gray-400">…</p>
  if (error) return <p className="text-sm text-red-600">{t('loadApptsFailed')}</p>
  if (clients.length === 0) return <p className="text-sm text-gray-500">{t('emptyClients')}</p>

  const toggle = key => setOpen(o => (o === key ? null : key))

  const bookingList = c => (
    <ul className="divide-y divide-gray-100">
      {c.bookings.map(b => (
        <li key={b.id} className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium text-gray-900">{fmtTime(b.startTime)}</span>
          <span className="text-gray-600">{serviceNames[b.serviceId] || `#${b.serviceId}`}</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_STYLES[b.status] || ''}`}>{t('status_' + b.status)}</span>
          {b.notes && <span className="w-full text-xs text-gray-500">“{b.notes}”</span>}
        </li>
      ))}
    </ul>
  )

  const count = c => t(c.bookings.length === 1 ? 'bookingsOne' : 'bookingsMany', { n: c.bookings.length })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('clientsSearch')}
          aria-label={t('clientsSearch')}
          className="w-full sm:max-w-xs h-11 rounded-xl border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <p className="text-sm text-gray-500">{t('clientsCount', { n: shown.length })}</p>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {shown.map(c => (
          <div key={c.key} className="rounded-xl border border-gray-200">
            <button type="button" onClick={() => toggle(c.key)} aria-expanded={open === c.key} className="w-full text-left p-4">
              <p className="font-semibold text-gray-900">{c.name}</p>
              {c.phone && <p className="text-sm text-gray-600">{c.phone}</p>}
              <p className="mt-2 text-xs font-semibold text-indigo-600">{count(c)} · {fmtDay(c.bookings[0].startTime)}</p>
            </button>
            {open === c.key && <div className="px-4 pb-3 border-t border-gray-100">{bookingList(c)}</div>}
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
              <th className="pb-2 pr-4">{t('colClient')}</th>
              <th className="pb-2 pr-4">{t('colPhone')}</th>
              <th className="pb-2 pr-4">{t('colVisits')}</th>
              <th className="pb-2">{t('colLastVisit')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(c => (
              <Fragment key={c.key}>
                <tr onClick={() => toggle(c.key)} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    <button type="button" aria-expanded={open === c.key} className="text-left">{c.name}</button>
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{c.phone || '-'}</td>
                  <td className="py-3 pr-4"><span className="inline-flex min-w-7 justify-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{c.bookings.length}</span></td>
                  <td className="py-3 text-gray-700">{fmtDay(c.bookings[0].startTime)}</td>
                </tr>
                {open === c.key && (
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td colSpan={4} className="px-4 py-2">{bookingList(c)}</td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
