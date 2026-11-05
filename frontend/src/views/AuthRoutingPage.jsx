import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth0 } from '../mockAuth'
import { useNavigate } from 'react-router-dom'
import { getMyTenant } from '../api/ownerApi'

export default function AuthRoutingPage() {
  const { getAccessTokenSilently, user } = useAuth0()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (user?.email && adminEmails.includes(user.email)) {
      navigate('/admin', { replace: true })
      return
    }

    // Role cache: returning owners skip the slow round-trip; the dashboard re-validates.
    if (sessionStorage.getItem('role') === 'owner') {
      navigate('/owner/dashboard', { replace: true })
      return
    }

    getAccessTokenSilently()
      .then(token => getMyTenant(token))
      .then(() => {
        sessionStorage.setItem('role', 'owner')
        if (!cancelled) navigate('/owner/dashboard', { replace: true })
      })
      .catch(err => {
        if (cancelled) return
        // Only a real "no tenant" answer means onboarding; timeouts/network errors get a retry.
        if (err?.error === 'NETWORK') setFailed(true)
        else navigate('/owner/onboard', { replace: true })
      })

    return () => { cancelled = true }
  }, [getAccessTokenSilently, navigate, user, attempt])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      {failed ? (
        <>
          <p className="text-gray-600">{t('timeoutError')}</p>
          <button onClick={() => { setFailed(false); setAttempt(a => a + 1) }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {t('retry')}
          </button>
        </>
      ) : (
        <>
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{t('loadingDashboard')}</p>
        </>
      )}
    </div>
  )
}
