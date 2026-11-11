import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, loginResponse } from '../test/tokens'

async function loadModules() {
  vi.resetModules()
  const auth = await import('../auth')
  const { http } = await import('./http')
  return { auth, http }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('http 401 handling', () => {
  it('signs the user out when the server rejects a request that carried a token', async () => {
    const { auth, http } = await loadModules()
    auth.signIn(loginResponse())
    fetch.mockResolvedValue(jsonResponse(401, {}))

    const res = await http('/x', { headers: { Authorization: `Bearer ${auth.authToken()}` } })

    expect(res.status).toBe(401)
    expect(auth.authToken()).toBeNull()
  })

  it('keeps the session when a request without a token gets a 401', async () => {
    const { auth, http } = await loadModules()
    auth.signIn(loginResponse())
    fetch.mockResolvedValue(jsonResponse(401, {}))

    await http('/x', { headers: { 'Content-Type': 'application/json' } })

    expect(auth.authToken()).not.toBeNull()
  })

  it('keeps the session on a 403, which means signed in but not allowed', async () => {
    const { auth, http } = await loadModules()
    auth.signIn(loginResponse())
    fetch.mockResolvedValue(jsonResponse(403, {}))

    await http('/x', { headers: { Authorization: `Bearer ${auth.authToken()}` } })

    expect(auth.authToken()).not.toBeNull()
  })

  it('works for calls with no options at all', async () => {
    const { http } = await loadModules()
    fetch.mockResolvedValue(jsonResponse(200, {}))

    await expect(http('/x')).resolves.toMatchObject({ status: 200 })
  })
})

describe('http network failures', () => {
  it('retries a GET once and returns the second result', async () => {
    const { http } = await loadModules()
    fetch.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(jsonResponse(200, {}))

    const res = await http('/x')

    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('throws a NETWORK error when the retry also fails', async () => {
    const { http } = await loadModules()
    fetch.mockRejectedValue(new TypeError('offline'))

    await expect(http('/x')).rejects.toEqual({ error: 'NETWORK' })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('never retries a POST, so a booking cannot be sent twice', async () => {
    const { http } = await loadModules()
    fetch.mockRejectedValue(new TypeError('offline'))

    await expect(http('/x', { method: 'POST' })).rejects.toEqual({ error: 'NETWORK' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
