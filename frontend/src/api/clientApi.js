import { http } from './http'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

function headers(token, tenantId) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
  }
}

export async function getMyAppointments(token, tenantId) {
  const res = await http(`${BASE}/appointments/me`, { headers: headers(token, tenantId) })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function cancelMyAppointment(token, tenantId, id) {
  const res = await http(`${BASE}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: headers(token, tenantId),
    body: JSON.stringify({ status: 'CANCELLED' }),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
