import { Navigate } from 'react-router-dom'
import { useAuth0 } from '../auth'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, accountType, user } = useAuth0()

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim())

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Only a hint for the UI: the backend enforces the real admin list on every /admin request.
  if (!isAuthenticated || accountType !== 'business' || !adminEmails.includes(user?.email)) {
    return <Navigate to="/partner" replace />
  }

  return children
}
