const BASE = 'http://localhost:8080/api/v1'

async function handleResponse(res) {
  if (res.ok) return res.json()
  const body = await res.json().catch(() => ({ error: 'UNKNOWN_ERROR' }))
  throw body
}

export async function getServices() {
  const res = await fetch(`${BASE}/services`)
  return handleResponse(res)
}

export async function getSlots(date) {
  const res = await fetch(`${BASE}/slots?date=${date}`)
  return handleResponse(res)
}

export async function createAppointment(payload) {
  const res = await fetch(`${BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}
