import { Outlet } from 'react-router-dom'
import ConsumerHeader from './ConsumerHeader'
import ConsumerFooter from './ConsumerFooter'

export default function ConsumerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ConsumerHeader />
      <main className="flex-1"><Outlet /></main>
      <ConsumerFooter />
    </div>
  )
}
