import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export default function NavBar() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0()

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim())
  const isAdmin = isAuthenticated && adminEmails.includes(user?.email)

  function handleLogout() {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-indigo-600 hover:text-indigo-700">
          ServiceBooking
        </Link>

        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <button
              onClick={() => loginWithRedirect()}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Login
            </button>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <Link
                to="/admin"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                Admin
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Logout
              </button>
            </>
          )}

          {isAuthenticated && !isAdmin && (
            <>
              <Link
                to="/auth/routing"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                My Area
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
