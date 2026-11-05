import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-gray-700">404</h1>
      <p className="text-gray-400">{t('notFoundText')}</p>
      <Link to="/" className="text-indigo-600 hover:underline">{t('backHome')}</Link>
    </div>
  )
}
