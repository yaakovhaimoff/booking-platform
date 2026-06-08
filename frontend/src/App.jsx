import { Routes, Route } from 'react-router-dom'
import LandingPage from './views/LandingPage'
import PublicStorePage from './views/PublicStorePage'
import OwnerDashboard from './views/OwnerDashboard'
import NotFoundPage from './views/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/"                  element={<LandingPage />} />
      <Route path="/store/:slug"       element={<PublicStorePage />} />
      <Route path="/owner/dashboard"   element={<OwnerDashboard />} />
      <Route path="*"                  element={<NotFoundPage />} />
    </Routes>
  )
}
