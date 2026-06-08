import { Auth0Provider } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

export default function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || '/owner/dashboard')
  }

  return (
    <Auth0Provider
      domain="YOUR_AUTH0_DOMAIN"        // e.g. dev-abc123.us.auth0.com
      clientId="YOUR_AUTH0_CLIENT_ID"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://api.servicebooking.com"  // must match Auth0 API audience
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}
