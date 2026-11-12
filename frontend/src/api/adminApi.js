import { http } from './http'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export async function getAdminTenants(token) {
  const res = await http(`${BASE}/admin/tenants`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function setTenantEnabled(token, id, enabled) {
  const res = await http(`${BASE}/admin/tenants/${id}/enabled`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled })
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function cleanUpUnusedImages(token, dryRun) {
  const res = await http(`${BASE}/admin/images/cleanup?dryRun=${dryRun}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
