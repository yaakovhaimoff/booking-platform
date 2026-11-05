import { useState, useEffect } from 'react'
import { getServices } from '../api/bookingApi'
import ServiceCard from './ServiceCard'
import { useI18n } from '../i18n'

export default function ServiceList({ currency, onSelect }) {
  const { t } = useI18n()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('servicesError'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-center text-gray-500 py-8">{t('loadingServices')}</p>
  }

  if (error) {
    return <p className="text-center text-red-600 py-8">{t(error)}</p>
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
