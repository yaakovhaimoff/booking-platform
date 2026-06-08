import { useState, useEffect } from 'react'
import { getServices } from '../api/bookingApi'
import ServiceCard from './ServiceCard'

export default function ServiceList({ onSelect }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('Could not load services. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Loading services...</p>
  }

  if (error) {
    return <p className="text-center text-red-600 py-8">{error}</p>
  }

  if (services.length === 0) {
    return <p className="text-center text-gray-500 py-8">No services available.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} onSelect={() => onSelect(service)} />
      ))}
    </div>
  )
}
