import { useState } from 'react'
import { getSlots, createAppointment } from '../api/bookingApi'
import ServiceList from '../components/ServiceList'
import DatePicker from '../components/DatePicker'
import SlotGrid from '../components/SlotGrid'
import CheckoutForm from '../components/CheckoutForm'
import ConfirmationScreen from '../components/ConfirmationScreen'

export default function BookingPage() {
  const [step, setStep] = useState('service')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState(null)

  function handleServiceSelect(service) {
    setSelectedService(service)
    setStep('date')
  }

  async function handleDateSelect(date) {
    setSelectedDate(date)
    setSlotsLoading(true)
    setError(null)
    try {
      const data = await getSlots(date)
      setSlots(data)
      setStep('slot')
    } catch (e) {
      setError(e.message || 'Could not load slots')
    } finally {
      setSlotsLoading(false)
    }
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot)
    setStep('form')
  }

  async function handleFormSubmit(clientName, clientPhone) {
    setError(null)
    try {
      const response = await createAppointment({
        serviceId: selectedService.id,
        clientName,
        clientPhone,
        startTime: selectedSlot,
      })
      setAppointment(response)
      setStep('confirmed')
    } catch (e) {
      setError(e.message || 'Booking failed. Please try again.')
    }
  }

  function handleReset() {
    setStep('service')
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlots([])
    setAppointment(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8 text-center">Book an Appointment</h1>

        {step === 'service' && (
          <ServiceList onSelect={handleServiceSelect} />
        )}

        {step === 'date' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Service: <span className="font-medium text-gray-700">{selectedService.name}</span>
            </p>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <DatePicker onSelect={handleDateSelect} />
          </div>
        )}

        {step === 'slot' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {selectedService.name} &mdash; {selectedDate}
            </p>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <SlotGrid slots={slots} loading={slotsLoading} onSelect={handleSlotSelect} />
          </div>
        )}

        {step === 'form' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {selectedService.name} &mdash; {selectedSlot.substring(11, 16)} on {selectedDate}
            </p>
            <CheckoutForm onSubmit={handleFormSubmit} error={error} />
          </div>
        )}

        {step === 'confirmed' && (
          <ConfirmationScreen
            appointment={appointment}
            serviceName={selectedService.name}
            onBookAnother={handleReset}
          />
        )}
      </div>
    </div>
  )
}
