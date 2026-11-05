import { useState, useEffect, useMemo } from 'react'
import { useAuth0 } from '../../mockAuth'
import { getAppointments, getServices, updateAppointmentStatus } from '../../api/ownerApi'
import AppointmentList from './AppointmentList'
import AppointmentCalendar from './AppointmentCalendar'
import { useI18n } from '../../i18n'

const FILTERS = [
  { id: 'TODAY',     label: 'filterToday' },
  { id: 'PENDING',   label: 'filterPending' },
  { id: 'CONFIRMED', label: 'filterConfirmed' },
  { id: 'ALL',       label: 'filterAll' },
  { id: 'CANCELLED', label: 'filterCancelled' },
]

const EMPTY_TEXT = {
  TODAY:     'emptyToday',
  PENDING:   'emptyPending',
  CONFIRMED: 'emptyConfirmed',
  ALL:       'emptyAll',
  CANCELLED: 'emptyCancelled',
}

export default function AppointmentQueueTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [filter, setFilter] = useState('TODAY')
  const [view, setView] = useState('calendar')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getAccessTokenSilently()
      .then(token => Promise.all([
        // ALL = no status param: backend returns everything except cancelled
        getAppointments(token, tenant.id, filter === 'ALL' || filter === 'TODAY' ? null : filter),
        getServices(token, tenant.id).catch(() => []),
      ]))
      .then(([appts, svcs]) => {
        if (cancelled) return
        setAppointments(appts)
        setServices(svcs)
      })
      .catch(() => { if (!cancelled) setError('loadApptsFailed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenant.id, filter, getAccessTokenSilently])

  const serviceNames = useMemo(
    () => Object.fromEntries(services.map(s => [s.id, s.name])),
    [services]
  )

  // Soonest first
  const sorted = useMemo(() => {
    const todayIso = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD in local time
    return appointments
      .filter(a => filter !== 'TODAY' || a.startTime.startsWith(todayIso))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [appointments, filter])

  async function changeStatus(id, status, failMessage) {
    const previous = appointments
    // Update in place; drop it from the list if it no longer matches the current filter
    setAppointments(prev => prev
      .map(a => (a.id === id ? { ...a, status } : a))
      .filter(a => filter === 'ALL' || filter === 'TODAY' ? a.status !== 'CANCELLED' : a.status === filter))
    try {
      const token = await getAccessTokenSilently()
      await updateAppointmentStatus(token, tenant.id, id, status)
    } catch {
      setAppointments(previous)
      setError(failMessage)
    }
  }

  const handleApprove = id => changeStatus(id, 'CONFIRMED', 'approveFailed')
  const handleCancel  = id => changeStatus(id, 'CANCELLED', 'cancelFailed')

  const showCalendar = filter === 'CONFIRMED' && view === 'calendar'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('tabAppointments')}</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 sm:flex-none px-1.5 sm:px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition ${
                filter === f.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {filter === 'CONFIRMED' && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-4">
          {[['calendar', 'viewCalendar'], ['list', 'viewList']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                view === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {t(error)}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : showCalendar ? (
        <AppointmentCalendar
          appointments={sorted}
          serviceNames={serviceNames}
          onApprove={handleApprove}
          onCancel={handleCancel}
        />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400">{t(EMPTY_TEXT[filter])}</p>
      ) : (
        <AppointmentList
          appointments={sorted}
          serviceNames={serviceNames}
          onApprove={handleApprove}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
