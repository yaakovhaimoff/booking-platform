import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth0 } from '../mockAuth'
import { getMyTenant } from '../api/ownerApi'
import { useI18n } from '../i18n'
import DashboardNav from '../components/owner/DashboardNav'
import { OWNER_TABS, ownerTabId } from '../components/owner/ownerTabs'
import StoreSettingsTab from '../components/owner/StoreSettingsTab'
import AppointmentQueueTab from '../components/owner/AppointmentQueueTab'
import ClientsTab from '../components/owner/ClientsTab'
import ServiceManagementTab from '../components/owner/ServiceManagementTab'
import AvailabilityMatrixTab from '../components/owner/AvailabilityMatrixTab'

export default function OwnerDashboard() {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const activeTab = ownerTabId(params.get('tab'))
  const setActiveTab = id => setParams({ tab: id })
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
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-8">
        <div className="md:flex md:gap-6 md:items-start">
          <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 min-w-0 pb-6 md:pb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-6">
              {t(OWNER_TABS.find(x => x.id === activeTab).label)}
            </h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              {activeTab === 'store'    && tenant && <StoreSettingsTab tenant={tenant} />}
              {activeTab === 'queue'    && tenant && <AppointmentQueueTab tenant={tenant} />}
              {activeTab === 'clients'  && tenant && <ClientsTab tenant={tenant} />}
              {activeTab === 'services' && tenant && <ServiceManagementTab tenant={tenant} />}
              {activeTab === 'hours'    && tenant && <AvailabilityMatrixTab tenant={tenant} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
