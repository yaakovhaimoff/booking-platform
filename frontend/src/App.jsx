import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import NavBar from './components/NavBar'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ConsumerLayout from './components/consumer/ConsumerLayout'
import BusinessLayout from './components/business/BusinessLayout'
import HomePage from './views/consumer/HomePage'
import ConsumerAuthPage from './views/consumer/ConsumerAuthPage'
import UserFlowPage from './views/consumer/UserFlowPage'
import SearchPage from './views/SearchPage'
import BusinessLandingPage from './views/business/BusinessLandingPage'
import PartnerLoginPage from './views/partner/PartnerLoginPage'
import PublicStorePage from './views/PublicStorePage'
import AdminPage from './views/AdminPage'
import OwnerDashboard from './views/OwnerDashboard'
import OwnerOnboardingPage from './views/OwnerOnboardingPage'
import ClientDashboard from './views/ClientDashboard'
import AuthRoutingPage from './views/AuthRoutingPage'
import NotFoundPage from './views/NotFoundPage'
import StubPage from './views/StubPage'

// Three separate worlds, each with its own chrome:
//   consumer  -> ConsumerLayout   (/, /auth, /user-flow, /search, /store/:slug, /client/*)
//   marketing -> BusinessLayout   (/for-business)
//   portal    -> /partner (own screen) and the owner app under NavBar (/owner/*, /admin, /auth/routing)
export default function App() {
  return (
    <Routes>
      <Route element={<ConsumerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<ConsumerAuthPage />} />
        <Route path="/user-flow" element={<UserFlowPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/store/:slug" element={<PublicStorePage />} />
        <Route path="/client/dashboard" element={<ProtectedRoute type="consumer"><ClientDashboard /></ProtectedRoute>} />
        <Route path="/help" element={<StubPage titleKey="pHelpTitle" />} />
        <Route path="/about" element={<StubPage titleKey="pAboutTitle" />} />
        <Route path="/privacy" element={<StubPage titleKey="pPrivacy" />} />
        <Route path="/terms" element={<StubPage titleKey="pTerms" />} />
      </Route>

      <Route element={<BusinessLayout />}>
        <Route path="/for-business" element={<BusinessLandingPage />} />
      </Route>

      <Route path="/partner" element={<PartnerLoginPage />} />

      <Route element={<div className="min-h-screen flex flex-col"><NavBar /><main className="flex-1"><Outlet /></main></div>}>
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/auth/routing" element={<ProtectedRoute><AuthRoutingPage /></ProtectedRoute>} />
        <Route path="/owner/dashboard" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/onboard" element={<ProtectedRoute><OwnerOnboardingPage /></ProtectedRoute>} />
      </Route>

      {/* Legacy entry points */}
      <Route path="/login" element={<Navigate to="/user-flow" replace />} />
      <Route path="/auth/login" element={<Navigate to="/user-flow" replace />} />
      <Route path="/signup" element={<Navigate to="/auth" replace />} />
      <Route path="/auth/signup" element={<Navigate to="/auth" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
