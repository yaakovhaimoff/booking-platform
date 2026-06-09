import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTenantBySlug } from '../api/tenantApi'
import { setTenantId } from '../api/bookingApi'
import BookingPage from './BookingPage'

export default function PublicStorePage() {
  const { slug } = useParams()
  const [state, setState] = useState({ loading: true, notFound: false, disabled: false, tenant: null })

  useEffect(() => {
    getTenantBySlug(slug)
      .then(tenant => {
        setTenantId(tenant.id)
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
        <span className="text-gray-400">Loading store…</span>
      </div>
    )
  }

  if (state.disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">This business is currently unavailable.</p>
      </div>
    )
  }

  if (state.notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-700">Store not found</h2>
        <p className="text-gray-400">No business exists at <code>/store/{slug}</code>.</p>
      </div>
    )
  }

  return (
    <BookingPage
      tenantName={state.tenant.slug}
      tenantSlug={state.tenant.slug}
    />
  )
}
