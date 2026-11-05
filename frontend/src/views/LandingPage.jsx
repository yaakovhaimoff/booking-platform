import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTenants } from '../api/tenantApi'
import { useI18n } from '../i18n'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listTenants()
      .then(data => {
        setTenants(data)
        setLoading(false)
      })
      .catch(() => {
        setError('loadBusinessesFailed')
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('findBusiness')}</h1>
          <p className="text-lg text-gray-500">{t('findBusinessSub')}</p>
        </div>

        {loading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-red-500">{t(error)}</p>
        )}

        {!loading && !error && tenants.length === 0 && (
          <p className="text-center text-gray-400">
            {t('noBusinesses')}
          </p>
        )}

        {!loading && !error && tenants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(tenant => (
              <button
                key={tenant.id}
                onClick={() => navigate(`/store/${tenant.slug}`)}
                className="text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {tenant.name}
                </h2>
                <p className="text-sm text-gray-400">/store/{tenant.slug}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
