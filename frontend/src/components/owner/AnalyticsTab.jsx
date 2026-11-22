import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth0 } from '../../auth'
import { getAppointments, getServices } from '../../api/ownerApi'
import { useI18n } from '../../i18n'
import { computeAnalytics, currentMonthKey, shiftMonth } from '../../utils/analytics'

const REVENUE_COLOR = '#0099ff'
const APPOINTMENTS_COLOR = '#ec5230'

function StatCard({ label, value, detail }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <section className="border border-gray-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="h-64">{children}</div>
    </section>
  )
}

export default function AnalyticsTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const { t, locale, fmtPrice } = useI18n()
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [monthKey, setMonthKey] = useState(() => currentMonthKey())

  useEffect(() => {
    let cancelled = false
    getAccessTokenSilently()
      .then(token => Promise.all([getAppointments(token, tenant.id, null), getServices(token, tenant.id)]))
      .then(([loadedAppointments, loadedServices]) => {
        if (!cancelled) { setAppointments(loadedAppointments); setServices(loadedServices) }
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenant.id, getAccessTokenSilently])

  const analytics = useMemo(() => computeAnalytics(appointments, services, monthKey), [appointments, services, monthKey])
  const [year, month] = monthKey.split('-').map(Number)
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const money = amount => fmtPrice(amount, tenant.currency)
  const serviceRows = analytics.byService.map(row => ({ ...row, name: row.name ?? t('analyticsDeletedService') }))

  if (loading) return <p className="text-sm text-gray-400">…</p>
  if (error) return <p className="text-sm text-red-600">{t('loadApptsFailed')}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setMonthKey(shiftMonth(monthKey, -1))} aria-label={t('prevMonth')}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">←</button>
        <p className="font-semibold text-gray-900 capitalize">{monthLabel}</p>
        <button type="button" onClick={() => setMonthKey(shiftMonth(monthKey, 1))} aria-label={t('nextMonth')}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">→</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('analyticsExpected')} value={money(analytics.expectedRevenue)}
          detail={t('analyticsEarnedDetail', { amount: money(analytics.earnedRevenue) })} />
        <StatCard label={t('analyticsBookings')} value={analytics.bookings} />
        <StatCard label={t('analyticsClients')} value={analytics.clients}
          detail={t('analyticsClientsDetail', { newClients: analytics.newClients, returningClients: analytics.returningClients })} />
        <StatCard label={t('analyticsAllTimeClients')} value={analytics.allTimeClients} />
      </div>

      {analytics.bookings === 0 ? (
        <p className="text-sm text-gray-500">{t('analyticsEmpty')}</p>
      ) : (
        <>
          <ChartCard title={t('analyticsRevenueChart')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={44} />
                <Tooltip formatter={value => money(value)} labelFormatter={day => `${day} ${monthLabel}`} />
                <Bar dataKey="revenue" name={t('analyticsExpected')} fill={REVENUE_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t('analyticsAppointmentsChart')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={44} />
                <Tooltip labelFormatter={day => `${day} ${monthLabel}`} />
                <Bar dataKey="appointments" name={t('analyticsBookings')} fill={APPOINTMENTS_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <section className="border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('analyticsServicesChart')}</h2>
            <div style={{ height: Math.max(160, serviceRows.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceRows} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="bookings" name={t('analyticsBookings')} fill={REVENUE_COLOR} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pr-4 font-medium">{t('analyticsServiceColumn')}</th>
                  <th className="py-2 pr-4 font-medium">{t('analyticsBookings')}</th>
                  <th className="py-2 font-medium text-right">{t('analyticsRevenueColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {serviceRows.map(row => (
                  <tr key={row.serviceId} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{row.name}</td>
                    <td className="py-2 pr-4 text-gray-600">{row.bookings}</td>
                    <td className="py-2 text-right text-gray-900">{money(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
