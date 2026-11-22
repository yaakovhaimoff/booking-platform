import { http } from './http'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

function authorized(token, extra = {}) {
  return { headers: { Authorization: `Bearer ${token}`, ...(extra.json ? { 'Content-Type': 'application/json' } : {}) } }
}

async function getJson(token, path) {
  const res = await http(`${BASE}/admin/${path}`, authorized(token))
  if (!res.ok) throw await res.json()
  return res.json()
}

export const getAdminSummary = token => getJson(token, 'summary')
export const getAdminTenants = token => getJson(token, 'tenants')
export const getAdminAccounts = token => getJson(token, 'accounts')
export const getAdminClients = token => getJson(token, 'clients')
export const getAdminAuditLog = token => getJson(token, 'audit-log')

export async function setTenantEnabled(token, id, enabled) {
  const res = await http(`${BASE}/admin/tenants/${id}/enabled`, {
    method: 'PATCH',
    ...authorized(token, { json: true }),
    body: JSON.stringify({ enabled })
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

async function deleteWithConfirmation(token, path, confirmation) {
  const res = await http(`${BASE}/admin/${path}`, {
    method: 'DELETE',
    ...authorized(token, { json: true }),
    body: JSON.stringify({ confirmation })
  })
  if (!res.ok) throw await res.json()
}

export const deleteTenant = (token, id, confirmation) => deleteWithConfirmation(token, `tenants/${id}`, confirmation)
export const deleteAccount = (token, id, confirmation) => deleteWithConfirmation(token, `accounts/${id}`, confirmation)

export async function cleanUpUnusedImages(token, dryRun) {
  const res = await http(`${BASE}/admin/images/cleanup?dryRun=${dryRun}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
