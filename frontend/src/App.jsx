import { Routes, Route } from 'react-router-dom'
import LandingPage from './views/LandingPage'
import PublicStorePage from './views/PublicStorePage'
import OwnerDashboard from './views/OwnerDashboard'
import OwnerOnboardingPage from './views/OwnerOnboardingPage'
import ClientDashboard from './views/ClientDashboard'
import AuthRoutingPage from './views/AuthRoutingPage'
import NotFoundPage from './views/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<LandingPage />} />
      <Route path="/store/:slug" element={<PublicStorePage />} />
      <Route
        path="/auth/routing"
        element={<ProtectedRoute><AuthRoutingPage /></ProtectedRoute>}
      />
      <Route
        path="/owner/dashboard"
        element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/owner/onboard"
        element={<ProtectedRoute><OwnerOnboardingPage /></ProtectedRoute>}
      />
      <Route
        path="/client/dashboard"
        element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
