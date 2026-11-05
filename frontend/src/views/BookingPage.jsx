import { useState } from 'react'
import { getSlots, createAppointment } from '../api/bookingApi'
import ServiceList from '../components/ServiceList'
import DatePicker from '../components/DatePicker'
import SlotGrid from '../components/SlotGrid'
import CheckoutForm from '../components/CheckoutForm'
import ConfirmationScreen from '../components/ConfirmationScreen'
import StoreHeader from '../components/StoreHeader'
import { useI18n } from '../i18n'

export default function BookingPage({ tenant }) {
  const { t, fmtDate, fmtPrice } = useI18n()
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
    } catch {
      setError(t('slotsError'))
    } finally {
      setSlotsLoading(false)
    }
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot)
    setStep('form')
  }

  async function handleFormSubmit(clientName, clientPhone, notes) {
    setError(null)
    try {
      const response = await createAppointment({
        serviceId: selectedService.id,
        clientName,
        clientPhone,
        notes: notes || null,
        startTime: selectedSlot,
      })
      setAppointment(response)
      setStep('confirmed')
    } catch {
      setError(t('bookingFailed'))
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

  function goBack() {
    if (step === 'date') { setStep('service') }
    else if (step === 'slot') { setStep('date'); setSelectedSlot(null); setSlots([]) }
    else if (step === 'form') { setStep('slot'); setSelectedSlot(null) }
  }

  const STEPS = ['service', 'date', 'slot', 'form']
  const stepIndex = STEPS.indexOf(step)
  const STEP_LABELS = t('steps')
  const serviceSummary = selectedService
    ? `${selectedService.name} · ${selectedService.durationMinutes} ${t('min')} · ${fmtPrice(selectedService.price, tenant.currency)}`
    : ''
  const showBack = step === 'date' || step === 'slot' || step === 'form'

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center sm:pt-6 sm:px-4">
      <div className="w-full max-w-xl">
        <StoreHeader tenant={tenant} compact={step !== 'service'} />
        <div className="px-4 sm:px-0 pb-12">

        {stepIndex >= 0 && (
          <div className="mb-5" aria-label={t('step', { n: stepIndex + 1 })}>
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {t('step', { n: stepIndex + 1 })} &middot; {STEP_LABELS[stepIndex]}
            </p>
          </div>
        )}

        {showBack && (
          <button
            onClick={goBack}
            className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 transition"
          >
            {t('back')}
          </button>
        )}

        {step === 'service' && (
          <ServiceList currency={tenant.currency} onSelect={handleServiceSelect} />
        )}

        {step === 'date' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {t('serviceLabel')} <span className="font-medium text-gray-700">{serviceSummary}</span>
            </p>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <DatePicker onSelect={handleDateSelect} />
          </div>
        )}

        {step === 'slot' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {serviceSummary} &mdash; {fmtDate(selectedDate)}
            </p>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <SlotGrid slots={slots} loading={slotsLoading} onSelect={handleSlotSelect} />
          </div>
        )}

        {step === 'form' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {serviceSummary} &mdash; {selectedSlot.substring(11, 16)} &middot; {fmtDate(selectedDate)}
            </p>
            <CheckoutForm onSubmit={handleFormSubmit} error={error} />
          </div>
        )}

        {step === 'confirmed' && (
          <ConfirmationScreen
            appointment={appointment}
            service={selectedService}
            tenant={tenant}
            onBookAnother={handleReset}
          />
        )}
        </div>
      </div>
    </div>
  )
}
