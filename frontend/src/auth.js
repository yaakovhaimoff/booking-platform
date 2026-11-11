// Session handling against the backend's login endpoints. The backend returns a signed bearer token at
// login; this module stores it, exposes the Auth0-shaped hook the app already uses (useAuth0), and clears
// the session when the token expires or the server rejects it. Moving to Auth0 later means replacing
// this file only: keep useAuth0, signIn, authToken and expireSession.
import { useSyncExternalStore } from 'react'

const SESSION_KEY = 'torni-session'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Keys written by the old browser-only demo login. Removed so nobody keeps a fake session or hashes.
const LEGACY_KEYS = ['demo-session', 'demo-account', 'demo-name', 'demo-phone', 'demo-identity', 'demo-accounts']

function tokenPayload(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(part))
  } catch {
    return null
  }
}

function isExpired(token) {
  const payload = tokenPayload(token)
  return !payload || !payload.exp || payload.exp * 1000 <= Date.now() + 5000
}

function readStored() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (stored && typeof stored.token === 'string' && !isExpired(stored.token)) return stored
  } catch { /* corrupt or unavailable storage: treat as signed out */ }
  return null
}

function stateFor(session) {
  if (!session) return { isLoading: false, isAuthenticated: false, accountType: null, user: undefined }
  const payload = tokenPayload(session.token) || {}
  return {
    isLoading: false,
    isAuthenticated: true,
    accountType: session.accountType,
    user: {
      sub: payload.sub,
      email: payload.email,
      login: session.identity,
      name: session.name || undefined,
      phone: session.phone || undefined,
    },
  }
}

let session = null
let current = stateFor(null)
const listeners = new Set()
const subscribe = callback => { listeners.add(callback); return () => listeners.delete(callback) }

function setSession(next) {
  session = next
  current = stateFor(next)
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch { /* storage unavailable: the session lasts until the page closes */ }
  sessionStorage.removeItem('role') // a different owner must not inherit the previous owner's cached routing
  listeners.forEach(listener => listener())
}

try { LEGACY_KEYS.forEach(key => localStorage.removeItem(key)) } catch { /* ignore */ }
session = readStored()
current = stateFor(session)

// The bearer token to attach to a request, or null when signed out or expired.
export function authToken() {
  if (session && isExpired(session.token)) setSession(null)
  return session ? session.token : null
}

// Called with the body of a successful /auth/signup or /auth/login response.
export function signIn(response) {
  setSession({
    token: response.token,
    identity: response.identity,
    name: response.name || '',
    phone: response.phone || '',
    accountType: response.accountType,
  })
}

// Called by the fetch wrapper when the server answers 401 to a request that carried our token.
export function expireSession() {
  if (session) setSession(null)
}

export const logout = () => setSession(null)
const getAccessTokenSilently = async () => authToken()

// Customer profile edit. Resolves true when the server saved it, false if it could not be reached
// or refused it (the form then shows a sync warning).
const updateProfile = async ({ name, phone }) => {
  const token = authToken()
  if (!token) return false
  try {
    const res = await fetch(`${API}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, phone: phone || '' }),
    })
    if (!res.ok) return false
    signIn(await res.json())
    return true
  } catch {
    return false
  }
}

const actions = { signIn, logout, getAccessTokenSilently, updateProfile }

export function useAuth0() {
  return { ...useSyncExternalStore(subscribe, () => current), ...actions }
}
