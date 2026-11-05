import { Link, useNavigate } from 'react-router-dom'
import { useAuth0 } from '../mockAuth'
import { useI18n } from '../i18n'
import LanguageToggle from './LanguageToggle'

export default function NavBar() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth0()

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim())
  const isAdmin = isAuthenticated && adminEmails.includes(user?.email)

  function handleLogout() {
    sessionStorage.removeItem('role')
    try { logout() } finally { navigate('/', { replace: true }) }
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="text-base sm:text-lg font-bold text-indigo-600 hover:text-indigo-700 truncate">
          ServiceBooking
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          {!isAuthenticated && (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                {t('login')}
              </Link>
              <Link
                to="/signup"
                className="px-3 sm:px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                {t('signup')}
              </Link>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <Link
                to="/admin"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                {t('admin')}
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t('logout')}
              </button>
            </>
          )}

          {isAuthenticated && !isAdmin && (
            <>
              <Link
                to="/auth/routing"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                {t('myArea')}
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t('logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
