import { useState, useEffect, useMemo } from 'react'
import { useAuth0 } from '../../mockAuth'
import { getAppointments, getServices, updateAppointmentStatus } from '../../api/ownerApi'
import AppointmentRow from './AppointmentRow'

const FILTERS = [
  { id: 'PENDING',   label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'ALL',       label: 'All' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

const EMPTY_TEXT = {
  PENDING:   'No pending appointments.',
  CONFIRMED: 'No confirmed appointments.',
  ALL:       'No appointments yet.',
  CANCELLED: 'No cancelled appointments.',
}

export default function AppointmentQueueTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [filter, setFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getAccessTokenSilently()
      .then(token => Promise.all([
        // ALL = no status param: backend returns everything except cancelled
        getAppointments(token, tenant.id, filter === 'ALL' ? null : filter),
        getServices(token, tenant.id).catch(() => []),
      ]))
      .then(([appts, svcs]) => {
        if (cancelled) return
        setAppointments(appts)
        setServices(svcs)
      })
      .catch(() => { if (!cancelled) setError('Failed to load appointments.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenant.id, filter, getAccessTokenSilently])

  const serviceNames = useMemo(
    () => Object.fromEntries(services.map(s => [s.id, s.name])),
    [services]
  )

  // Soonest first
  const sorted = useMemo(
    () => [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments]
  )

  async function changeStatus(id, status, failMessage) {
    const previous = appointments
    // Update in place; drop it from the list if it no longer matches the current filter
    setAppointments(prev => prev
      .map(a => (a.id === id ? { ...a, status } : a))
      .filter(a => filter === 'ALL' ? a.status !== 'CANCELLED' : a.status === filter))
    try {
      const token = await getAccessTokenSilently()
      await updateAppointmentStatus(token, tenant.id, id, status)
    } catch {
      setAppointments(previous)
      setError(failMessage)
    }
  }

  const handleApprove = id => changeStatus(id, 'CONFIRMED', 'Failed to approve appointment.')
  const handleCancel  = id => changeStatus(id, 'CANCELLED', 'Failed to cancel appointment.')

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Appointments</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                filter === f.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400">{EMPTY_TEXT[filter]}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Service</th>
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  serviceName={serviceNames[a.serviceId]}
                  onApprove={handleApprove}
                  onCancel={handleCancel}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
