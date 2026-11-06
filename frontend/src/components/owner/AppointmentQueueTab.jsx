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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAccessTokenSilently()
      .then(token => Promise.all([
        getAppointments(token, tenant.id, null),          // no status param: everything except cancelled
        getAppointments(token, tenant.id, 'CANCELLED'),
        getServices(token, tenant.id).catch(() => []),
      ]))
      .then(([live, cancelledList, svcs]) => {
        if (cancelled) return
        setAppointments([...live, ...cancelledList])
        setServices(svcs)
      })
      .catch(() => { if (!cancelled) setError('loadApptsFailed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenant.id, getAccessTokenSilently])

  const serviceNames = useMemo(
    () => Object.fromEntries(services.map(s => [s.id, s.name])),
    [services]
  )

  const live = useMemo(() => appointments.filter(a => a.status !== 'CANCELLED'), [appointments])

  // Bottom list for the selected tab. Soonest first.
  const sorted = useMemo(() => {
    const todayIso = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD in local time
    const pick = {
      TODAY: a => a.status !== 'CANCELLED' && a.startTime.startsWith(todayIso),
      PENDING: a => a.status === 'PENDING',
      CONFIRMED: a => a.status === 'CONFIRMED',
      ALL: a => a.status !== 'CANCELLED',
      CANCELLED: a => a.status === 'CANCELLED',
    }[filter]
    return appointments.filter(pick).sort((x, y) => x.startTime.localeCompare(y.startTime))
  }, [appointments, filter])

  async function changeStatus(id, status, failMessage) {
    const previous = appointments
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status } : a)))
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

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {t(error)}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <AppointmentCalendar
            appointments={live}
            serviceNames={serviceNames}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />

          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-fit mb-4">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 sm:flex-none px-1.5 sm:px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition ${
                    filter === f.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t(f.label)}
                </button>
              ))}
            </div>

            {sorted.length === 0 ? (
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
        </>
      )}
    </div>
  )
}
