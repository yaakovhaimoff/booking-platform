import { Outlet } from 'react-router-dom'
import BusinessHeader from './BusinessHeader'
import BusinessFooter from './BusinessFooter'

export default function BusinessLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <BusinessHeader />
      <main className="flex-1"><Outlet /></main>
      <BusinessFooter />
    </div>
  )
}
