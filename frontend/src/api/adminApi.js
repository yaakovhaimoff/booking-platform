const BASE = 'http://localhost:8080/api/v1'

export async function getAdminTenants(token) {
  const res = await fetch(`${BASE}/admin/tenants`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function setTenantEnabled(token, id, enabled) {
  const res = await fetch(`${BASE}/admin/tenants/${id}/enabled`, {
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
