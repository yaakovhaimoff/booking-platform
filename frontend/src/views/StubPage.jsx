import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

// Placeholder for linked pages that are not built yet. `titleKey` is an i18n key.
export default function StubPage({ titleKey }) {
  const { t } = useI18n()
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-950">{t(titleKey)}</h1>
      <p className="mt-3 text-gray-600">{t('pComingSoon')}</p>
      <Link to="/" className="mt-6 inline-block text-indigo-600 hover:underline">{t('pBackHome')}</Link>
    </div>
  )
}
