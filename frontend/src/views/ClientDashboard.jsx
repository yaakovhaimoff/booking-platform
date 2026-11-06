import { useEffect, useState } from 'react'
import { useAuth0 } from '../mockAuth'
import { listTenants } from '../api/tenantApi'
import { getMyAppointments, cancelMyAppointment } from '../api/clientApi'
import { useI18n } from '../i18n'
import AppointmentHistoryRow from '../components/client/AppointmentHistoryRow'

// Bookings live in each shop's own schema, so load them from every shop and merge.
export default function ClientDashboard() {
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
            ? r.value.map(a => ({ ...a, tenantId: tenants[i].id, shopName: tenants[i].name || tenants[i].slug }))
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
    <div className="bg-gray-50 px-4 py-12 min-h-[60vh]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('myBookings')}</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{t(error)}</div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">{t('lookingUp')}</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noAppointmentsHere')}</p>
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
      </div>
    </div>
  )
}
