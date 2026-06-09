// DEV MODE: Auth0 bypass. To re-enable real auth:
//   1. Delete this file
//   2. In every file that imports from './mockAuth' (or '../mockAuth', '../../mockAuth'),
//      change the import back to '@auth0/auth0-react'
//   3. Re-enable the jwtChain in SecurityConfig.java
//   4. Restore JwtAuthenticationToken params in TenantController + AppointmentController

const DEV_TOKEN = 'dev-bypass-token'
const DEV_USER = { sub: 'dev|owner1', email: 'dev@example.com', name: 'Dev User' }

export function useAuth0() {
  return {
    isAuthenticated: true,
    isLoading: false,
    user: DEV_USER,
    loginWithRedirect: () => {},
    logout: () => {},
    getAccessTokenSilently: async () => DEV_TOKEN,
  }
}

export function Auth0Provider({ children }) {
  return children
}
