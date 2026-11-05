// DEV MODE: Auth0 bypass. To re-enable real auth:
//   1. Delete this file
//   2. In every file that imports from './mockAuth' (or '../mockAuth', '../../mockAuth'),
//      change the import back to '@auth0/auth0-react'
//   3. Re-enable the jwtChain in SecurityConfig.java
//   4. Restore JwtAuthenticationToken params in TenantController + AppointmentController

import { useSyncExternalStore } from 'react'

const DEV_TOKEN = 'dev-bypass-token'
const DEV_USER = { sub: 'dev|owner1', email: 'dev@example.com', name: 'Dev User' }
const KEY = 'demo-session'

// Persisted local session so Login / Logout actually do something in demo mode.
const listeners = new Set()
const read = () => localStorage.getItem(KEY) === '1'
let authed = read()
const set = v => {
  authed = v
  if (v) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY)
  listeners.forEach(l => l())
}
const subscribe = cb => { listeners.add(cb); return () => listeners.delete(cb) }

// Module-level so references are stable across renders (a new function each render
// made every useEffect([getAccessTokenSilently]) refetch in an infinite loop).
const loginWithRedirect = () => { set(true) }
const logout = () => { set(false) }
const getAccessTokenSilently = async () => DEV_TOKEN
const base = { isLoading: false, loginWithRedirect, logout, getAccessTokenSilently }
const IN = { ...base, isAuthenticated: true, user: DEV_USER }
const OUT = { ...base, isAuthenticated: false, user: undefined }

export function useAuth0() {
  const a = useSyncExternalStore(subscribe, () => authed)
  return a ? IN : OUT
}

export function Auth0Provider({ children }) {
  return children
}
