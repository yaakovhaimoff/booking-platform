const BASE = 'http://localhost:8080/api/v1'

// GET /api/v1/tenants/{slug}
// Returns: { id: number, slug: string, schemaName: string }
// Throws the parsed JSON body on 4xx/5xx (same convention as bookingApi.js)
export async function getTenantBySlug(slug) {
  const res = await fetch(`${BASE}/tenants/${slug}`)
  if (!res.ok) throw await res.json()
  return res.json()
}
