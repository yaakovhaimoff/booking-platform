import { useState } from 'react'
import { useAuth0 } from '../mockAuth'
import { useNavigate } from 'react-router-dom'
import { createTenant } from '../api/ownerApi'
import { useI18n } from '../i18n'

export default function OwnerOnboardingPage() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    setSubmitting(true)
    try {
      const token = await getAccessTokenSilently()
      await createTenant(token, name)
      navigate('/owner/dashboard')
    } catch {
      setError(t('genericError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('setUpStore')}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t('onboardIntro')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              {t('businessName')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Mike's Barbershop"
              maxLength={100}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submitting ? t('creating') : t('createStore')}
          </button>
        </form>
      </div>
    </div>
  )
}
