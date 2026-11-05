import { useState, useEffect } from 'react'
import { getServices } from '../api/bookingApi'
import Skeleton from './Skeleton'
import ServiceCard from './ServiceCard'
import { useI18n } from '../i18n'

export default function ServiceList({ currency, onSelect }) {
  const { t } = useI18n()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('servicesError'))
      .finally(() => setLoading(false))
  }, [attempt])

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label={t('loadingServices')}>
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-3">{t(error)}</p>
        <button onClick={() => { setError(null); setLoading(true); setAttempt(a => a + 1) }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('retry')}</button>
      </div>
    )
  }

  if (services.length === 0) {
    return <p className="text-center text-gray-500 py-8">{t('noServices')}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} currency={currency} onSelect={() => onSelect(service)} />
      ))}
    </div>
  )
}
