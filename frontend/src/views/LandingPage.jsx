import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listTenants } from '../api/tenantApi'
import { useI18n } from '../i18n'
import Skeleton from '../components/Skeleton'

const CACHE_KEY = 'tenants-cache'

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) } catch { return null }
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  // Show the last known list instantly, then refresh in the background.
  const [tenants, setTenants] = useState(() => readCache() || [])
  const [loading, setLoading] = useState(() => !readCache())
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
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

  const q = query.trim().toLowerCase()
  const shown = q
    ? tenants.filter(x => `${x.name || ''} ${x.address || ''} ${x.slug}`.toLowerCase().includes(q))
    : tenants

  return (
    <div className="bg-gray-50">
      <section className="bg-gradient-to-b from-indigo-50 to-gray-50 px-4 pt-14 pb-10 sm:pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">{t('heroTitle')}</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8">{t('heroSub')}</p>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchBusinesses')}
            aria-label={t('findBusiness')}
            className="w-full max-w-md bg-white border border-gray-300 rounded-full px-5 py-3 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">{t('findBusiness')}</h2>

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
                className="group text-left bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div
                  className="h-32 bg-gradient-to-br from-indigo-500 to-indigo-800 bg-cover bg-center"
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

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">{t('howTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">{n}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{t(`how${n}t`)}</h3>
                <p className="text-sm text-gray-500">{t(`how${n}d`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-indigo-600 px-6 py-10 sm:py-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('ownerCtaTitle')}</h2>
          <p className="text-indigo-100 mb-6 max-w-lg mx-auto">{t('ownerCtaSub')}</p>
          <Link to="/signup" className="inline-block bg-white text-indigo-700 font-semibold rounded-lg px-6 py-3 hover:bg-indigo-50 transition">
            {t('ownerCtaBtn')}
          </Link>
        </section>
      </div>
    </div>
  )
}
