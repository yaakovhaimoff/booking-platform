import { useState, useEffect } from 'react'
import { useAuth0 } from '../../mockAuth'
import { setTenantId, getServices } from '../../api/bookingApi'
import { createService, updateService, deleteService } from '../../api/ownerApi'
import ServiceTable from './ServiceTable'
import ServiceFormModal from './ServiceFormModal'
import { useI18n } from '../../i18n'

export default function ServiceManagementTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setTenantId(tenant.id)
    getServices()
      .then(data => setServices(data))
      .catch(() => setError('loadServicesFailed'))
      .finally(() => setLoading(false))
  }, [tenant.id])

  async function handleSave(data) {
    const token = await getAccessTokenSilently()
    if (editTarget) {
      const updated = await updateService(token, tenant.id, editTarget.id, data)
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
    } else {
      const created = await createService(token, tenant.id, data)
      setServices(prev => [...prev, created])
    }
    setEditTarget(null)
    setShowForm(false)
  }

  async function handleDelete(id) {
    if (!window.confirm(t('confirmDeleteService'))) return
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      await deleteService(token, tenant.id, id)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('deleteServiceFailed')
    }
  }

  function openEdit(service) {
    setEditTarget(service)
    setShowForm(true)
  }

  function openCreate() {
    setEditTarget(null)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {t(error)}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('servicesTitle')}</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          {t('addService')}
        </button>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-gray-400">{t('noServicesYet')}</p>
      ) : (
        <ServiceTable services={services} currency={tenant.currency} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {showForm && (
        <ServiceFormModal
          service={editTarget}
          currency={tenant.currency}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
