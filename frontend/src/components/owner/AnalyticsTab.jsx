import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth0 } from '../../auth'
import { getAppointments, getServices } from '../../api/ownerApi'
import { useI18n } from '../../i18n'
import { addDays, bestMonth, computeAnalytics, currentMonthKey, mondayOf, monthlyBuckets, monthRange, shiftMonth, weekRange, yearRange } from '../../utils/analytics'

const CONFIRMED_COLOR = '#0099ff'
const PENDING_COLOR = '#f5a524'

function StatCard({ label, value, detail, hint }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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
  const [view, setView] = useState('month')
  const [monthKey, setMonthKey] = useState(() => currentMonthKey())
  const [weekStart, setWeekStart] = useState(() => mondayOf())
  const [year, setYear] = useState(() => new Date().getFullYear())

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

  const isWeek = view === 'week'
  const isYear = view === 'year'
  const range = useMemo(
    () => (isYear ? yearRange(year) : isWeek ? weekRange(weekStart) : monthRange(monthKey)),
    [isYear, isWeek, year, weekStart, monthKey],
  )
  const analytics = useMemo(() => computeAnalytics(appointments, services, range), [appointments, services, range])

  const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
  const chartData = useMemo(() => (isYear ? monthlyBuckets(analytics.daily) : analytics.daily), [isYear, analytics.daily])
  const best = isYear ? bestMonth(chartData) : null
  const monthName = date => parseDate(date).toLocaleDateString(locale, { month: 'long' })
  const periodLabel = isYear ? String(year) : isWeek
    ? `${parseDate(range.from).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${parseDate(addDays(range.from, 6)).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : parseDate(range.from).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const tickLabel = date => (isYear ? parseDate(date).toLocaleDateString(locale, { month: 'short' }) : isWeek ? parseDate(date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }) : String(Number(date.slice(8, 10))))
  const tooltipLabel = date => isYear ? monthName(date) : parseDate(date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })
  const money = amount => fmtPrice(amount, tenant.currency)
  const serviceRows = analytics.byService.map(row => ({ ...row, name: row.name ?? t('analyticsDeletedService') }))
  const step = delta => (isYear ? setYear(year + delta) : isWeek ? setWeekStart(addDays(weekStart, delta * 7)) : setMonthKey(shiftMonth(monthKey, delta)))

  if (loading) return <p className="text-sm text-gray-400">…</p>
  if (error) return <p className="text-sm text-red-600">{t('loadApptsFailed')}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['year', 'month', 'week'].map(option => (
            <button key={option} type="button" onClick={() => setView(option)} aria-pressed={view === option}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${view === option ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t({ month: 'analyticsViewMonth', week: 'analyticsViewWeek', year: 'analyticsViewYear' }[option])}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => step(-1)} aria-label={t(isYear ? 'prevYear' : isWeek ? 'prevWeek' : 'prevMonth')}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">←</button>
          <p className="font-semibold text-gray-900 capitalize min-w-36 text-center">{periodLabel}</p>
          <button type="button" onClick={() => step(1)} aria-label={t(isYear ? 'nextYear' : isWeek ? 'nextWeek' : 'nextMonth')}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">→</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('analyticsExpected')} value={money(analytics.expectedRevenue)}
          detail={t('analyticsExpectedDetail', { confirmed: money(analytics.confirmedRevenue), pending: money(analytics.pendingRevenue) })} />
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('analyticsBookings')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.bookings}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.pendingBookings > 0
              ? <Link to="?tab=queue" className="font-medium text-brand-600 hover:underline">{t('analyticsPendingLink', { n: analytics.pendingBookings })}</Link>
              : t('analyticsPendingLink', { n: 0 })}
          </p>
        </div>
        <StatCard label={t('analyticsClients')} value={analytics.clients}
          detail={t('analyticsClientsDetail', { firstTimeClients: analytics.firstTimeClients, repeatClients: analytics.repeatClients })}
          hint={t('analyticsClientsHint')} />
        <StatCard label={t('analyticsAllTimeClients')} value={analytics.allTimeClients}
          detail={t('analyticsEarnedDetail', { amount: money(analytics.earnedRevenue) })} />
      </div>

      {best && (
        <p className="text-sm text-gray-600">{t('analyticsBestMonth', { month: monthName(best.date), amount: money(best.revenue) })}</p>
      )}

      {analytics.bookings === 0 ? (
        <p className="text-sm text-gray-500">{t('analyticsEmpty')}</p>
      ) : (
        <>
          <ChartCard title={t(isYear ? 'analyticsRevenueChartYear' : 'analyticsRevenueChart')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickLabel} tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} width={44} />
                <Tooltip formatter={value => money(value)} labelFormatter={tooltipLabel} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="confirmedRevenue" stackId="revenue" name={t('analyticsConfirmed')} fill={CONFIRMED_COLOR} />
                <Bar dataKey="pendingRevenue" stackId="revenue" name={t('analyticsPending')} fill={PENDING_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t(isYear ? 'analyticsAppointmentsChartYear' : 'analyticsAppointmentsChart')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickLabel} tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={44} />
                <Tooltip labelFormatter={tooltipLabel} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="confirmedAppointments" stackId="appointments" name={t('analyticsConfirmed')} fill={CONFIRMED_COLOR} />
                <Bar dataKey="pendingAppointments" stackId="appointments" name={t('analyticsPending')} fill={PENDING_COLOR} radius={[3, 3, 0, 0]} />
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
                  <Bar dataKey="bookings" name={t('analyticsBookings')} fill={CONFIRMED_COLOR} radius={[0, 3, 3, 0]} />
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
