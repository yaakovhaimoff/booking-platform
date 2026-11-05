import { Link, useNavigate } from 'react-router-dom'
import { useAuth0 } from '../mockAuth'
import { useI18n } from '../i18n'

// Demo-mode auth entry point (Auth0 is bypassed; see mockAuth.js).
export default function LoginPage({ mode }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { loginWithRedirect } = useAuth0()
  const signup = mode === 'signup'

  function go() {
    loginWithRedirect()
    navigate('/auth/routing', { replace: true })
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t(signup ? 'signupTitle' : 'loginTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t(signup ? 'signupSub' : 'loginSub')}</p>
        <button onClick={go} className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 transition">
          {t('continueDemo')}
        </button>
        <p className="text-sm text-gray-500 mt-5">
          {t(signup ? 'haveAccount' : 'noAccount')}{' '}
          <Link to={signup ? '/login' : '/signup'} className="text-indigo-600 font-medium hover:underline">
            {t(signup ? 'login' : 'signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
