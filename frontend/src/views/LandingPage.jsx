import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
      <h1 className="text-4xl font-bold text-gray-900">ServiceBooking</h1>
      <p className="text-gray-500">Book appointments with local businesses.</p>

      {isAuthenticated ? (
        <Link
          to="/client/dashboard"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          My Bookings
        </Link>
      ) : (
        <button
          onClick={() => loginWithRedirect()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Log in
        </button>
      )}
    </div>
  )
}
