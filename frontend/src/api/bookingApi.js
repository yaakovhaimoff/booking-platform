import { http } from './http'
import { authToken } from '../auth'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Set once by PublicStorePage after slug resolution.
// All functions below read this variable — no callers need to change.
let _tenantId = null
export function setTenantId(id) {
  _tenantId = id
}

function tenantHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', 'X-Tenant-ID': _tenantId, ...extra }
}

// Public routes that also accept a signed-in customer: attach the token when there is one so the booking
// or review is tied to the account. Guests send no Authorization header.
function optionalAuthHeaders() {
  const token = authToken()
  return tenantHeaders(token ? { Authorization: `Bearer ${token}` } : {})
}

export async function getServices() {
  const res = await http(`${BASE}/services`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getSlots(date, serviceId) {
  const res = await http(`${BASE}/slots?date=${date}&serviceId=${serviceId}`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function createAppointment(payload) {
  const res = await http(`${BASE}/appointments`, {
    method: 'POST',
    headers: optionalAuthHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getOpenDates(from, to, serviceId) {
  const res = await http(`${BASE}/slots/open-dates?from=${from}&to=${to}&serviceId=${serviceId}`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getPublicHours() {
  const res = await http(`${BASE}/operating-hours`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getReviews() {
  const res = await http(`${BASE}/reviews`, { headers: tenantHeaders() })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function createReview(payload) {
  const res = await http(`${BASE}/reviews`, {
    method: 'POST',
    headers: optionalAuthHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
