import { http } from './http'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// GET /api/v1/tenants/{slug}
// Returns the public store profile: { id, slug, name, address, phone, ... } (no internal fields)
// Throws the parsed JSON body on 4xx/5xx (same convention as bookingApi.js)
export async function getTenantBySlug(slug) {
  const res = await http(`${BASE}/tenants/${slug}`)
  if (!res.ok) throw await res.json()
  return res.json()
}

// GET /api/v1/tenants
// Returns: PublicTenant[] = [{ id: number, slug: string, name: string }, ...]
export async function listTenants() {
  const res = await http(`${BASE}/tenants`)
  if (!res.ok) throw await res.json()
  return res.json()
}
