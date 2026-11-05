import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTenantBySlug } from '../api/tenantApi'
import { setTenantId } from '../api/bookingApi'
import BookingPage from './BookingPage'
import { useI18n, enterStore, leaveStore } from '../i18n'

export default function PublicStorePage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [state, setState] = useState({ loading: true, notFound: false, disabled: false, tenant: null })

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
        setState({ loading: false, notFound, disabled, tenant: null })
      })
  }, [slug])

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">{t('loadingStore')}</span>
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
      tenant={state.tenant}
    />
  )
}
