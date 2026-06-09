import { Auth0Provider } from './mockAuth'
import { useNavigate } from 'react-router-dom'

export default function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate()

  const onRedirectCallback = () => {
    navigate('/auth/routing', { replace: true })
  }

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: 'https://api.servicebooking.com',
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}
