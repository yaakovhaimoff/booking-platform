import { useEffect } from 'react'
import { useAuth0 } from '../mockAuth'
import { useNavigate } from 'react-router-dom'
import { getMyTenant } from '../api/ownerApi'

export default function AuthRoutingPage() {
  const { getAccessTokenSilently, user } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (user?.email && adminEmails.includes(user.email)) {
      navigate('/admin', { replace: true })
      return
    }

    getAccessTokenSilently()
      .then(token => getMyTenant(token))
      .then(() => {
        if (!cancelled) navigate('/owner/dashboard', { replace: true })
      })
      .catch(() => {
        if (!cancelled) navigate('/owner/onboard', { replace: true })
      })

    return () => { cancelled = true }
  }, [getAccessTokenSilently, navigate, user])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
