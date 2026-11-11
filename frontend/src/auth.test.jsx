import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { fakeToken, jsonResponse, loginResponse } from './test/tokens'

const SESSION_KEY = 'torni-session'

// auth.js keeps its session in module state, so each test loads a fresh copy after preparing storage.
async function loadAuth() {
  vi.resetModules()
  return import('./auth')
}

function storeSession(overrides = {}) {
  const response = loginResponse(overrides)
  localStorage.setItem(SESSION_KEY, JSON.stringify(response))
  return response
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('starting up', () => {
  it('starts signed out when nothing is stored', async () => {
    const { authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())

    expect(authToken()).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accountType).toBeNull()
    expect(result.current.user).toBeUndefined()
  })

  it('restores a valid stored session', async () => {
    const stored = storeSession({ name: 'Ann', phone: '39333', accountType: 'consumer' })
    const { authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())

    expect(authToken()).toBe(stored.token)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.accountType).toBe('consumer')
    expect(result.current.user).toMatchObject({ sub: 'local|1', email: 'owner@torni.test', login: 'owner@torni.test', name: 'Ann', phone: '39333' })
  })

  it('ignores a stored session whose token has expired', async () => {
    storeSession({ token: fakeToken({ expiresInSeconds: -60 }) })
    const { authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())

    expect(authToken()).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('ignores a token that is about to expire within seconds', async () => {
    storeSession({ token: fakeToken({ expiresInSeconds: 2 }) })
    const { authToken } = await loadAuth()

    expect(authToken()).toBeNull()
  })

  it('ignores corrupt or malformed stored data', async () => {
    localStorage.setItem(SESSION_KEY, '{not json')
    expect((await loadAuth()).authToken()).toBeNull()

    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'not-a-jwt', accountType: 'business' }))
    expect((await loadAuth()).authToken()).toBeNull()

    localStorage.setItem(SESSION_KEY, JSON.stringify({ identity: 'x' }))
    expect((await loadAuth()).authToken()).toBeNull()
  })

  it('removes the keys left behind by the old browser-only demo login', async () => {
    for (const key of ['demo-session', 'demo-account', 'demo-name', 'demo-phone', 'demo-identity', 'demo-accounts']) {
      localStorage.setItem(key, 'x')
    }
    const { authToken } = await loadAuth()

    expect(authToken()).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})

describe('signIn, logout and expireSession', () => {
  it('signIn stores the session, exposes the user and clears the cached owner role', async () => {
    sessionStorage.setItem('role', 'owner')
    const { signIn, authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    const response = loginResponse({ name: 'Owner', accountType: 'business' })

    act(() => signIn(response))

    expect(authToken()).toBe(response.token)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.accountType).toBe('business')
    expect(result.current.user.name).toBe('Owner')
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).token).toBe(response.token)
    expect(sessionStorage.getItem('role')).toBeNull()
  })

  it('a phone login has no email on the user', async () => {
    const { signIn, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())

    act(() => signIn(loginResponse({ token: fakeToken({ sub: 'local|9' }), identity: '+39333000111', accountType: 'consumer' })))

    expect(result.current.user.email).toBeUndefined()
    expect(result.current.user.login).toBe('+39333000111')
    expect(result.current.user.sub).toBe('local|9')
  })

  it('logout clears the session, the stored copy and the cached role', async () => {
    const { signIn, authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    act(() => signIn(loginResponse()))
    sessionStorage.setItem('role', 'owner')

    act(() => result.current.logout())

    expect(authToken()).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    expect(sessionStorage.getItem('role')).toBeNull()
  })

  it('expireSession signs out, and does nothing when already signed out', async () => {
    const { signIn, expireSession, authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    const listener = vi.fn()
    act(() => signIn(loginResponse()))

    act(() => expireSession())
    expect(authToken()).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)

    renderHook(() => { listener(); return useAuth0() })
    const calls = listener.mock.calls.length
    act(() => expireSession())
    expect(listener.mock.calls.length).toBe(calls)
  })

  it('a token that expires while the page is open signs the user out on the next read', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T10:00:00Z'))
    const { signIn, authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    act(() => signIn(loginResponse({ token: fakeToken({ expiresInSeconds: 600, now: Date.now() }) })))
    expect(authToken()).not.toBeNull()

    vi.setSystemTime(new Date('2030-01-01T10:11:00Z'))

    act(() => { expect(authToken()).toBeNull() })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('getAccessTokenSilently resolves the current token, or null when signed out', async () => {
    const { signIn, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    expect(await result.current.getAccessTokenSilently()).toBeNull()

    const response = loginResponse()
    act(() => signIn(response))
    expect(await result.current.getAccessTokenSilently()).toBe(response.token)
  })

  it('exposes stable action functions so effects depending on them do not loop', async () => {
    const { useAuth0 } = await loadAuth()
    const { result, rerender } = renderHook(() => useAuth0())
    const first = result.current.getAccessTokenSilently

    rerender()

    expect(result.current.getAccessTokenSilently).toBe(first)
  })
})

describe('updateProfile', () => {
  it('sends the token and new details, then stores the refreshed session', async () => {
    const { signIn, authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    const original = loginResponse({ accountType: 'consumer', name: 'Ann' })
    act(() => signIn(original))
    const refreshed = loginResponse({ accountType: 'consumer', name: 'Ann B', phone: '39333', token: fakeToken({ expiresInSeconds: 7200 }) })
    fetch.mockResolvedValue(jsonResponse(200, refreshed))

    let saved
    await act(async () => { saved = await result.current.updateProfile({ name: 'Ann B', phone: '39333' }) })

    expect(saved).toBe(true)
    const [url, options] = fetch.mock.calls[0]
    expect(url).toMatch(/\/auth\/profile$/)
    expect(options.method).toBe('PUT')
    expect(options.headers.Authorization).toBe(`Bearer ${original.token}`)
    expect(JSON.parse(options.body)).toEqual({ name: 'Ann B', phone: '39333' })
    expect(authToken()).toBe(refreshed.token)
    expect(result.current.user).toMatchObject({ name: 'Ann B', phone: '39333' })
  })

  it('sends an empty phone string when the phone is cleared', async () => {
    const { signIn, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    act(() => signIn(loginResponse({ accountType: 'consumer' })))
    fetch.mockResolvedValue(jsonResponse(200, loginResponse({ accountType: 'consumer' })))

    await act(async () => { await result.current.updateProfile({ name: 'Ann', phone: '' }) })

    expect(JSON.parse(fetch.mock.calls[0][1].body).phone).toBe('')
  })

  it('returns false and keeps the old session when the server refuses', async () => {
    const { signIn, authToken, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    const original = loginResponse({ accountType: 'consumer' })
    act(() => signIn(original))
    fetch.mockResolvedValue(jsonResponse(400, { error: 'INVALID' }))

    let saved
    await act(async () => { saved = await result.current.updateProfile({ name: 'Ann', phone: '1' }) })

    expect(saved).toBe(false)
    expect(authToken()).toBe(original.token)
  })

  it('returns false when the server cannot be reached', async () => {
    const { signIn, useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())
    act(() => signIn(loginResponse({ accountType: 'consumer' })))
    fetch.mockRejectedValue(new TypeError('network down'))

    let saved
    await act(async () => { saved = await result.current.updateProfile({ name: 'Ann', phone: '1' }) })

    expect(saved).toBe(false)
  })

  it('returns false without calling the server when signed out', async () => {
    const { useAuth0 } = await loadAuth()
    const { result } = renderHook(() => useAuth0())

    let saved
    await act(async () => { saved = await result.current.updateProfile({ name: 'Ann', phone: '1' }) })

    expect(saved).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})
