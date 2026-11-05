// DEV MODE: Auth0 bypass. To re-enable real auth:
//   1. Delete this file
//   2. In every file that imports from './mockAuth' (or '../mockAuth', '../../mockAuth'),
//      change the import back to '@auth0/auth0-react'
//   3. Re-enable the jwtChain in SecurityConfig.java
//   4. Restore JwtAuthenticationToken params in TenantController + AppointmentController

const DEV_TOKEN = 'dev-bypass-token'
const DEV_USER = { sub: 'dev|owner1', email: 'dev@example.com', name: 'Dev User' }

// Module-level so references are stable across renders. Real Auth0 returns a stable
// getAccessTokenSilently; a new function each render made every
// useEffect([getAccessTokenSilently]) refetch in an infinite loop.
const loginWithRedirect = () => {}
const logout = () => {}
const getAccessTokenSilently = async () => DEV_TOKEN
const AUTH = {
  isAuthenticated: true,
  isLoading: false,
  user: DEV_USER,
  loginWithRedirect,
  logout,
  getAccessTokenSilently,
}

export function useAuth0() {
  return AUTH
}

export function Auth0Provider({ children }) {
  return children
}
