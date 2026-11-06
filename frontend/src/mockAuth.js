// DEV MODE: Auth0 bypass. To re-enable real auth:
//   1. Delete this file
//   2. In every file that imports from './mockAuth' (or '../mockAuth', '../../mockAuth'),
//      change the import back to '@auth0/auth0-react'
//   3. Re-enable the jwtChain in SecurityConfig.java
//   4. Restore JwtAuthenticationToken params in TenantController + AppointmentController
//   5. Remove devHeaders() from api/ownerApi.js and X-Dev-User-* from CorsConfig.java

import { useSyncExternalStore } from 'react'

const DEV_TOKEN = 'dev-bypass-token'
const KEY = 'demo-session'
const TYPE_KEY = 'demo-account'   // 'consumer' | 'business'. Sessions that predate account types are business.
const ID_KEY = 'demo-identity'    // what the business owner typed at login (email / phone / provider)

// The original demo owner (and its existing shop) is dev|owner1. Logging in as this email reaches it.
const LEGACY_OWNER_EMAIL = 'dev@example.com'

// Each distinct business identity is its own owner, so each can register its own store.
function buildUser(type, identity) {
  if (type === 'consumer') return { sub: 'dev|client1', email: 'client@example.com', name: 'Dev Client' }
  const id = (identity || LEGACY_OWNER_EMAIL).trim().toLowerCase()
  const email = id.includes('@') ? id : `${id.replace(/\W/g, '')}@demo.local`
  return { sub: email === LEGACY_OWNER_EMAIL ? 'dev|owner1' : `dev|${id}`, email, name: id }
}

const listeners = new Set()
// Persisted local session so Login / Logout actually do something in demo mode.
const OUT = { isLoading: false, isAuthenticated: false, accountType: null, user: undefined }
let current = OUT

function make(type, identity) {
  return { isLoading: false, isAuthenticated: true, accountType: type, user: buildUser(type, identity) }
}
if (localStorage.getItem(KEY) === '1') {
  current = make(localStorage.getItem(TYPE_KEY) === 'consumer' ? 'consumer' : 'business', localStorage.getItem(ID_KEY))
}

const emit = () => listeners.forEach(l => l())
const subscribe = cb => { listeners.add(cb); return () => listeners.delete(cb) }

// Module-level so references are stable across renders (a new function each render
// made every useEffect([getAccessTokenSilently]) refetch in an infinite loop).
const loginWithRedirect = opts => {
  const type = opts?.accountType === 'consumer' ? 'consumer' : 'business'
  localStorage.setItem(KEY, '1'); localStorage.setItem(TYPE_KEY, type)
  if (opts?.identity) localStorage.setItem(ID_KEY, opts.identity); else localStorage.removeItem(ID_KEY)
  sessionStorage.removeItem('role') // a different owner must not inherit the previous owner's cached routing
  current = make(type, opts?.identity)
  emit()
}
const logout = () => {
  localStorage.removeItem(KEY); localStorage.removeItem(TYPE_KEY); localStorage.removeItem(ID_KEY)
  current = OUT
  emit()
}
const getAccessTokenSilently = async () => DEV_TOKEN

// Dev identity headers the backend reads instead of a JWT (see TenantController).
export function devHeaders() {
  const u = current.user
  return u ? { 'X-Dev-User-Sub': u.sub, 'X-Dev-User-Email': u.email } : {}
}

const fns = { loginWithRedirect, logout, getAccessTokenSilently }
export function useAuth0() {
  return { ...useSyncExternalStore(subscribe, () => current), ...fns }
}

export function Auth0Provider({ children }) {
  return children
}
