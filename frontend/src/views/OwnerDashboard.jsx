import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OwnerDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/')
  }, [isLoading, isAuthenticated])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>
      <p className="text-gray-500">Welcome, {user?.email}</p>
      <p className="text-sm text-gray-400">Full dashboard coming in Phase 3.</p>
    </div>
  )
}
