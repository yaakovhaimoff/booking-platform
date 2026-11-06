import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth0 } from '../../mockAuth'
import CodeAuthForm from '../../components/shared/CodeAuthForm'
import { useI18n } from '../../i18n'
import Logo from '../../components/shared/Logo'

// Business portal entry. Login and signup share this screen (email-first). Own layout: no marketplace chrome.
export default function PartnerLoginPage() {
  const { loginWithRedirect, isAuthenticated, accountType } = useAuth0()
  const navigate = useNavigate()
  const { t } = useI18n()
  if (isAuthenticated && accountType === 'business') return <Navigate to="/auth/routing" replace />

  function done(identity) {
    loginWithRedirect({ accountType: 'business', identity })
    navigate('/auth/routing', { replace: true })
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="flex flex-col px-6 py-6">
        <Logo to="/for-business" />
        <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto py-10">
          <h1 className="text-2xl font-bold text-gray-950 text-center">{t('pProsHeading')}</h1>
          <p className="mt-1 mb-8 text-sm text-gray-500 text-center">{t('pProsSub')}</p>
          <CodeAuthForm primary="email" onVerified={done} />
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm">
            <p className="font-semibold text-gray-900">{t('pAreCustomer')}</p>
            <Link to="/" className="text-indigo-600 hover:underline">{t('pGoCustomers')}</Link>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400">{t('pRecaptcha')}</p>
      </div>
      <div className="hidden lg:flex relative bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 items-end p-12 rounded-l-[120px]">
        <div className="text-white">
          <p className="text-5xl font-extrabold tracking-tight">torni</p>
          <p className="text-lg text-white/80">{t('pBusinessTag')}</p>
        </div>
      </div>
    </div>
  )
}
