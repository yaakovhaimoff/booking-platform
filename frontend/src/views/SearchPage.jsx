import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listTenants } from '../api/tenantApi'
import { useI18n } from '../i18n'
import Skeleton from '../components/Skeleton'

const CACHE_KEY = 'tenants-cache'

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) } catch { return null }
}

export default function SearchPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  // Show the last known list instantly, then refresh in the background.
  const [tenants, setTenants] = useState(() => readCache() || [])
  const [loading, setLoading] = useState(() => !readCache())
  const [error, setError] = useState(null)
  const [params] = useSearchParams()
  const query = [params.get('q'), params.get('where')].filter(Boolean).join(' ')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    listTenants()
      .then(data => {
        if (cancelled) return
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
        setTenants(data)
        setError(null)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('loadBusinessesFailed')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [attempt])

  const q = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shown = q.length
    ? tenants.filter(x => { const hay = `${x.name || ''} ${x.address || ''} ${x.slug}`.toLowerCase(); return q.every(w => hay.includes(w)) })
    : tenants

  return (
    <div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <h2 className="font-display text-4xl font-extrabold text-gray-950 mb-6">{t('findBusiness')}</h2>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && tenants.length === 0 && (
          <div className="text-center">
            <p className="text-red-500 mb-3">{t(error)}</p>
            <button onClick={() => { setLoading(true); setError(null); setAttempt(a => a + 1) }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              {t('retry')}
            </button>
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <p className="text-center text-gray-400">{t('noBusinesses')}</p>
        )}

        {!loading && tenants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map(tenant => (
              <button
                key={tenant.id}
                onClick={() => navigate(`/store/${tenant.slug}`)}
                className="group text-left bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-950 transition-colors"
              >
                <div
                  className="h-32 bg-indigo-600 bg-cover bg-center"
                  style={tenant.coverUrl ? { backgroundImage: `url("${tenant.coverUrl}")` } : undefined}
                />
                <div className="p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{tenant.name || tenant.slug}</h3>
                    {tenant.address && <p className="text-sm text-gray-500 truncate">{tenant.address}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-indigo-600 group-hover:translate-x-0.5 transition">{t('bookNow')} →</span>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
