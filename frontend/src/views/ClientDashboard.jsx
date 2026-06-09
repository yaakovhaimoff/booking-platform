import { useState } from 'react'
import { useAuth0 } from '../mockAuth'
import { getTenantBySlug } from '../api/tenantApi'
import { getMyAppointments, cancelMyAppointment } from '../api/clientApi'
import AppointmentHistoryRow from '../components/client/AppointmentHistoryRow'

export default function ClientDashboard() {
  const { getAccessTokenSilently } = useAuth0()
  const [slugInput, setSlugInput] = useState('')
  const [tenantId, setTenantId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLookup(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const tenant = await getTenantBySlug(slugInput.trim())
      const token = await getAccessTokenSilently()
      const data = await getMyAppointments(token, tenant.id)
      setTenantId(tenant.id)
      setAppointments(data)
    } catch (err) {
      if (err?.error === 'TENANT_NOT_FOUND') {
        setError('No store found with that slug.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id) {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a)
    )
    try {
      const token = await getAccessTokenSilently()
      await cancelMyAppointment(token, tenantId, id)
    } catch {
      setError('Failed to cancel appointment.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        <form onSubmit={handleLookup} className="flex gap-3 mb-8">
          <input
            type="text"
            value={slugInput}
            onChange={e => setSlugInput(e.target.value)}
            placeholder="Store slug (e.g. my-salon)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? 'Looking up…' : 'Look up'}
          </button>
        </form>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {tenantId !== null && (
          appointments.length === 0 ? (
            <p className="text-sm text-gray-400">No appointments found at this store.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Start Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="px-4">
                  {appointments.map(a => (
                    <AppointmentHistoryRow key={a.id} appointment={a} onCancel={handleCancel} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
