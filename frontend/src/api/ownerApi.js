const BASE = 'http://localhost:8080/api/v1'

function authHeaders(token, tenantId = null) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  if (tenantId != null) headers['X-Tenant-ID'] = tenantId
  return headers
}

export async function getMyTenant(token) {
  const res = await fetch(`${BASE}/tenants/me`, { headers: authHeaders(token) })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function createTenant(token, slug, name) {
  const res = await fetch(`${BASE}/tenants`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ slug, name }),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function createService(token, tenantId, data) {
  const res = await fetch(`${BASE}/services`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function updateService(token, tenantId, id, data) {
  const res = await fetch(`${BASE}/services/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function deleteService(token, tenantId, id) {
  const res = await fetch(`${BASE}/services/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token, tenantId),
  })
  if (!res.ok) throw await res.json()
}

export async function getPendingAppointments(token, tenantId) {
  const res = await fetch(`${BASE}/appointments?status=PENDING`, {
    headers: authHeaders(token, tenantId),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

// status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null (null = all except cancelled)
export async function getAppointments(token, tenantId, status = null) {
  const qs = status ? `?status=${status}` : ''
  const res = await fetch(`${BASE}/appointments${qs}`, {
    headers: authHeaders(token, tenantId),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getServices(token, tenantId) {
  const res = await fetch(`${BASE}/services`, {
    headers: authHeaders(token, tenantId),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function updateAppointmentStatus(token, tenantId, id, status) {
  const res = await fetch(`${BASE}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getOperatingHours(token, tenantId) {
  const res = await fetch(`${BASE}/operating-hours`, {
    headers: authHeaders(token, tenantId),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function updateOperatingHours(token, tenantId, rows) {
  const res = await fetch(`${BASE}/operating-hours`, {
    method: 'PUT',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
