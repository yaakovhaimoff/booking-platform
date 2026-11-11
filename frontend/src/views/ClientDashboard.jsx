import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth0 } from '../mockAuth'
import { listTenants } from '../api/tenantApi'
import { getMyAppointments, cancelMyAppointment } from '../api/clientApi'
import { useI18n } from '../i18n'
import AppointmentHistoryRow from '../components/client/AppointmentHistoryRow'
import SideNav from '../components/shared/SideNav'

const TABS = [
  { id: 'bookings', label: 'pMyBookings' },
  { id: 'profile', label: 'pProfile' },
]

// Customer account: sidebar on desktop, hamburger menu on mobile (same pattern as the owner dashboard).
export default function ClientDashboard() {
  const { t } = useI18n()
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(x => x.id === params.get('tab')) ? params.get('tab') : 'bookings'

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto md:flex">
        {/* Desktop sidebar. On mobile the same links live in the hamburger menu. */}
        <SideNav
          items={TABS.map(x => ({ id: x.id, label: t(x.label) }))}
          active={tab}
          onSelect={id => setParams({ tab: id })}
          onLogout={() => { logout(); navigate('/', { replace: true }) }}
          logoutLabel={t('pLogOut')}
          label={t('pAccount')}
          className="sticky top-16 h-[calc(100vh-4rem)]"
        />
        <div className="flex-1 min-w-0 px-4 md:px-8 py-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold font-display" aria-hidden="true">
              {(user?.name || user?.login || '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-gray-950 truncate">{user?.name || t('pAccount')}</h1>
              <p className="text-sm text-gray-600 truncate">{user?.login}</p>
            </div>
          </div>
          {tab === 'bookings' ? <BookingsTab /> : <ProfileTab />}
        </div>
      </div>
    </div>
  )
}

// Bookings live in each shop's own schema, so load them from every shop and merge.
function BookingsTab() {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [token, tenants] = await Promise.all([getAccessTokenSilently(), listTenants()])
        const results = await Promise.allSettled(tenants.map(s => getMyAppointments(token, s.id)))
        if (cancelled) return
        const all = results.flatMap((r, i) =>
          r.status === 'fulfilled'
            ? r.value.map(a => ({ ...a, tenantId: tenants[i].id, shopName: tenants[i].name || tenants[i].slug, shopSlug: tenants[i].slug }))
            : [])
        all.sort((a, b) => b.startTime.localeCompare(a.startTime))
        setAppointments(all)
        if (results.length && results.every(r => r.status === 'rejected')) setError('genericError')
      } catch {
        if (!cancelled) setError('genericError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [getAccessTokenSilently])

  async function handleCancel(appt) {
    setAppointments(prev => prev.map(a => (a.id === appt.id && a.tenantId === appt.tenantId) ? { ...a, status: 'CANCELLED' } : a))
    try {
      const token = await getAccessTokenSilently()
      await cancelMyAppointment(token, appt.tenantId, appt.id)
    } catch {
      setError('cancelFailed')
    }
  }

  return (
    <>
      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{t(error)}</div>}

      {loading ? (
        <p className="text-sm text-gray-400">{t('lookingUp')}</p>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">{t('pNoBookings')}</p>
          <Link to="/search" className="mt-4 inline-flex h-11 items-center rounded-xl bg-gray-950 px-6 text-sm font-bold text-white hover:bg-gray-800">{t('pBrowse')}</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">{t('colShop')}</th>
                <th className="px-4 py-3">{t('colStart')}</th>
                <th className="px-4 py-3">{t('colStatus')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="px-4">
              {appointments.map(a => (
                <AppointmentHistoryRow key={`${a.tenantId}-${a.id}`} appointment={a} onCancel={() => handleCancel(a)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function ProfileTab() {
  const { user, updateProfile } = useAuth0()
  const { t } = useI18n()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const inputCls = 'w-full h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

  async function submit(e) {
    e.preventDefault()
    setSaved(false)
    if (!name.trim()) { setError(t('nameRequired')); return }
    const digits = phone.replace(/\D/g, '')
    if (phone.trim() && digits.length < 6) { setError(t('pBadPhone')); return }
    setError('')
    const synced = await updateProfile({ name: name.trim(), phone: digits })
    if (!synced) setError(t('pProfileSyncFailed'))
    setSaved(true)
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5 max-w-md" noValidate>
      <p className="text-sm text-gray-600">{t('pProfileSub')}</p>
      <label className="text-sm font-semibold text-gray-900">
        {t('fullName')}
        <input value={name} onChange={e => { setName(e.target.value); setSaved(false) }} type="text" maxLength={100} autoComplete="name" className={`${inputCls} mt-1.5`} />
      </label>
      <label className="text-sm font-semibold text-gray-900">
        {t('phone')}
        <input value={phone} onChange={e => { setPhone(e.target.value); setSaved(false) }} type="tel" inputMode="tel" autoComplete="tel" className={`${inputCls} mt-1.5`} />
        <span className="block mt-1 text-xs font-normal text-gray-500">{t('pPhoneHint')}</span>
      </label>
      <div className="text-sm">
        <p className="font-semibold text-gray-900">{t('pLoginDetail')}</p>
        <p className="text-gray-600">{user?.login}</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" className="h-12 rounded-xl bg-gray-950 px-6 text-sm font-bold text-white hover:bg-gray-800">{t('pSaveProfile')}</button>
        {saved && <span role="status" className="text-sm font-semibold text-green-700">{t('pProfileSaved')}</span>}
      </div>
    </form>
  )
}
