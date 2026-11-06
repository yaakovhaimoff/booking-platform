import { Outlet, useLocation } from 'react-router-dom'
import ConsumerHeader from './ConsumerHeader'
import ConsumerFooter from './ConsumerFooter'

export default function ConsumerLayout() {
  // The account dashboard is an app screen: no marketing footer.
  const inDashboard = useLocation().pathname.startsWith('/client/')
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ConsumerHeader />
      <main className="flex-1"><Outlet /></main>
      {!inDashboard && <ConsumerFooter />}
    </div>
  )
}
