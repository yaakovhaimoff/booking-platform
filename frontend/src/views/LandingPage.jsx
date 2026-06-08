import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()
  const navigate = useNavigate()

  // If already logged in and lands here, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/owner/dashboard')
  }, [isAuthenticated])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
      <h1 className="text-4xl font-bold text-gray-900">ServiceBooking</h1>
      <p className="text-gray-500">Book appointments with local businesses.</p>
      <button
        onClick={() => loginWithRedirect({
          appState: { returnTo: '/owner/dashboard' }
        })}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Log in as a business owner
      </button>
    </div>
  )
}
