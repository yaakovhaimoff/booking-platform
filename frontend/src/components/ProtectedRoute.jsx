import { useAuth0 } from '../auth'
import { Navigate } from 'react-router-dom'

// type: which account world this route belongs to. Wrong or missing session -> that world's login.
export default function ProtectedRoute({ children, type = 'business' }) {
  const { isAuthenticated, isLoading, accountType } = useAuth0()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || accountType !== type) return <Navigate to={type === 'consumer' ? '/auth' : '/partner'} replace />

  return children
}
