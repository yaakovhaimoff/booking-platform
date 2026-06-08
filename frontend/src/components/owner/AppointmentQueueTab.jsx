import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { getPendingAppointments, updateAppointmentStatus } from '../../api/ownerApi'
import AppointmentRow from './AppointmentRow'

export default function AppointmentQueueTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => getPendingAppointments(token, tenant.id))
      .then(data => setAppointments(data))
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(false))
  }, [tenant.id, getAccessTokenSilently])

  async function handleApprove(id) {
    setAppointments(prev => prev.filter(a => a.id !== id))
    try {
      const token = await getAccessTokenSilently()
      await updateAppointmentStatus(token, tenant.id, id, 'CONFIRMED')
    } catch {
      setError('Failed to approve appointment.')
    }
  }

  async function handleCancel(id) {
    setAppointments(prev => prev.filter(a => a.id !== id))
    try {
      const token = await getAccessTokenSilently()
      await updateAppointmentStatus(token, tenant.id, id, 'CANCELLED')
    } catch {
      setError('Failed to cancel appointment.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Appointments</h2>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <p className="text-sm text-gray-400">No pending appointments.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Service</th>
                <th className="pb-2 pr-4">Start Time</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
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
