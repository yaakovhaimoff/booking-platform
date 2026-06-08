const BASE = 'http://localhost:8080/api/v1'

// Set once by PublicStorePage after slug resolution.
// All functions below read this variable — no callers need to change.
let _tenantId = null
export function setTenantId(id) {
  _tenantId = id
}

function tenantHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', 'X-Tenant-ID': _tenantId, ...extra }
}

export async function getServices() {
  const res = await fetch(`${BASE}/services`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getSlots(date) {
  const res = await fetch(`${BASE}/slots?date=${date}`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function createAppointment(payload) {
  const res = await fetch(`${BASE}/appointments`, {
    method: 'POST',
    headers: tenantHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
