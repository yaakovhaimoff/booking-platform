import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, loginResponse } from '../test/tokens'

async function loadModules() {
  vi.resetModules()
  const auth = await import('../auth')
  const api = await import('./bookingApi')
  api.setTenantId(12)
  return { auth, api }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(201, { id: 1 })))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe.each([
  ['createAppointment', api => api.createAppointment({ serviceId: 1 }), '/appointments'],
  ['createReview', api => api.createReview({ rating: 5 }), '/reviews'],
])('%s', (_name, call, path) => {
  it('sends no Authorization header for a guest', async () => {
    const { api } = await loadModules()

    await call(api)

    const [url, options] = fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`${path}$`))
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBeUndefined()
    expect(options.headers['X-Tenant-ID']).toBe(12)
  })

  it('sends the bearer token when a customer is signed in', async () => {
    const { auth, api } = await loadModules()
    const response = loginResponse({ accountType: 'consumer' })
    auth.signIn(response)

    await call(api)

    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${response.token}`)
  })

  it('never puts an identity in the body, the server takes it from the token', async () => {
    const { auth, api } = await loadModules()
    auth.signIn(loginResponse({ accountType: 'consumer' }))

    await call(api)

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body).not.toHaveProperty('clientAuth0Sub')
    expect(body).not.toHaveProperty('authorAuth0Sub')
  })

  it('throws the server error body on failure', async () => {
    const { api } = await loadModules()
    fetch.mockResolvedValue(jsonResponse(409, { error: 'SLOT_TAKEN' }))

    await expect(call(api)).rejects.toEqual({ error: 'SLOT_TAKEN' })
  })
})

describe('public reads', () => {
  it('never send a token, only the tenant header', async () => {
    const { auth, api } = await loadModules()
    auth.signIn(loginResponse())
    fetch.mockResolvedValue(jsonResponse(200, []))

    await api.getServices()
    await api.getSlots('2030-01-01', 3)
    await api.getPublicHours()
    await api.getReviews()

    for (const [, options] of fetch.mock.calls) {
      expect(options.headers.Authorization).toBeUndefined()
      expect(options.headers['X-Tenant-ID']).toBe(12)
    }
  })
})
