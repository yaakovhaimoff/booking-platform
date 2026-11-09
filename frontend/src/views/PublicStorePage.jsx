import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTenantBySlug } from '../api/tenantApi'
import { setTenantId } from '../api/bookingApi'
import Skeleton from '../components/Skeleton'
import BookingPage from './BookingPage'
import { useI18n, enterStore, leaveStore } from '../i18n'

export default function PublicStorePage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [state, setState] = useState({ loading: true, notFound: false, disabled: false, tenant: null, failed: false })
  const [attempt, setAttempt] = useState(0)
  const [draft, setDraft] = useState(null)

  // Owner dashboard preview: when embedded in our own dashboard, show the owner's unsaved edits.
  useEffect(() => {
    if (window.parent === window) return
    document.documentElement.style.overscrollBehavior = 'contain'
    const onMessage = e => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return
      if (e.data?.type === 'store-preview') setDraft(e.data.tenant)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'store-preview-ready' }, window.location.origin)
    return () => {
      window.removeEventListener('message', onMessage)
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [])

  // Leaving the store page returns to the global language
  useEffect(() => leaveStore, [])

  useEffect(() => {
    getTenantBySlug(slug)
      .then(tenant => {
        setTenantId(tenant.id)
        enterStore(tenant.slug, tenant.defaultLanguage)
        setState({ loading: false, notFound: false, disabled: false, tenant })
      })
      .catch(err => {
        const notFound = err?.error === 'TENANT_NOT_FOUND'
        const disabled = err?.error === 'TENANT_DISABLED'
        setState({ loading: false, notFound, disabled, tenant: null, failed: !notFound && !disabled })
      })
  }, [slug, attempt])

  if (state.loading) {
    return (
      <div className="max-w-xl mx-auto sm:pt-6" aria-busy="true" aria-label={t('loadingStore')}>
        <Skeleton className="h-44 w-full rounded-none sm:rounded-2xl" />
        <div className="px-4 mt-6 flex flex-col gap-3">
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (state.failed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-600">{t('timeoutError')}</p>
        <button onClick={() => { setState(s => ({ ...s, loading: true, failed: false })); setAttempt(a => a + 1) }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('retry')}</button>
      </div>
    )
  }

  if (state.disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">{t('unavailable')}</p>
      </div>
    )
  }

  if (state.notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-700">{t('storeNotFound')}</h2>
        <p className="text-gray-400">{t('noBusinessAt')} <code>/store/{slug}</code>.</p>
      </div>
    )
  }

  return (
    <BookingPage
      tenant={draft ? { ...state.tenant, ...draft } : state.tenant}
    />
  )
}
