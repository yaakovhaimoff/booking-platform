import { useState, useEffect } from 'react'
import { useAuth0 } from '../mockAuth'
import { getMyTenant } from '../api/ownerApi'
import DashboardNav from '../components/owner/DashboardNav'
import StoreSettingsTab from '../components/owner/StoreSettingsTab'
import AppointmentQueueTab from '../components/owner/AppointmentQueueTab'
import ServiceManagementTab from '../components/owner/ServiceManagementTab'
import AvailabilityMatrixTab from '../components/owner/AvailabilityMatrixTab'

export default function OwnerDashboard() {
  const { getAccessTokenSilently } = useAuth0()
  const [activeTab, setActiveTab] = useState('store')
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => getMyTenant(token))
      .then(data => setTenant(data))
      .finally(() => setLoading(false))
  }, [getAccessTokenSilently])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Owner Dashboard</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'store'    && tenant && <StoreSettingsTab tenant={tenant} />}
          {activeTab === 'queue'    && tenant && <AppointmentQueueTab tenant={tenant} />}
          {activeTab === 'services' && tenant && <ServiceManagementTab tenant={tenant} />}
          {activeTab === 'hours'    && tenant && <AvailabilityMatrixTab tenant={tenant} />}
        </div>
      </div>
    </div>
  )
}
