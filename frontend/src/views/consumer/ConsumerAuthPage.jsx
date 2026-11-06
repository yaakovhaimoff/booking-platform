import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth0 } from '../../mockAuth'
import { useI18n } from '../../i18n'
import CodeAuthForm from '../../components/shared/CodeAuthForm'

// Consumer login + signup share this one screen (phone-first).
export default function ConsumerAuthPage() {
  const { loginWithRedirect, isAuthenticated, accountType } = useAuth0()
  const navigate = useNavigate()
  const { t } = useI18n()
  if (isAuthenticated && accountType === 'consumer') return <Navigate to="/client/dashboard" replace />

  function done(identity, name) {
    loginWithRedirect({ accountType: 'consumer', identity, name })
    navigate('/client/dashboard', { replace: true })
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-4xl font-extrabold text-gray-950">{t('pAuthTitle')}</h1>
      <p className="mt-2 mb-8 text-gray-600">{t('pAuthSub')}</p>
      <CodeAuthForm primary="phone" onVerified={done} />
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm">
        <p className="font-semibold text-gray-900">{t('pHaveBusiness')}</p>
        <Link to="/partner" className="text-indigo-700 font-semibold hover:underline">{t('pGoPros')}</Link>
      </div>
    </div>
  )
}
