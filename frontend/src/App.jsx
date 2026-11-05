import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './views/LandingPage'
import PublicStorePage from './views/PublicStorePage'
import AdminPage from './views/AdminPage'
import OwnerDashboard from './views/OwnerDashboard'
import OwnerOnboardingPage from './views/OwnerOnboardingPage'
import ClientDashboard from './views/ClientDashboard'
import AuthRoutingPage from './views/AuthRoutingPage'
import LoginPage from './views/LoginPage'
import NotFoundPage from './views/NotFoundPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/store/:slug" element={<PublicStorePage />} />
          <Route path="/admin"       element={<AdminRoute><AdminPage /></AdminRoute>} />
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
          {['/login', '/auth/login'].map(p => <Route key={p} path={p} element={<LoginPage mode="login" />} />)}
          {['/signup', '/auth/signup'].map(p => <Route key={p} path={p} element={<LoginPage mode="signup" />} />)}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
