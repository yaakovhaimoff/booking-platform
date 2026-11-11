import { useEffect, useState } from 'react'
import { getSlots, createAppointment, getPublicHours, getReviews } from '../api/bookingApi'
import { hoursOnDate } from '../utils/openStatus'
import ServiceList from '../components/ServiceList'
import DatePicker from '../components/DatePicker'
import SlotGrid from '../components/SlotGrid'
import CheckoutForm from '../components/CheckoutForm'
import ConfirmationScreen from '../components/ConfirmationScreen'
import StoreHeader from '../components/StoreHeader'
import Gallery from '../components/Gallery'
import Reviews from '../components/Reviews'
import StoreInfo from '../components/StoreInfo'
import { useI18n } from '../i18n'
import { useAuth0 } from '../auth'

export default function BookingPage({ tenant }) {
  const { t, fmtDate, fmtPrice } = useI18n()
  const { isAuthenticated, accountType, user } = useAuth0()
  const signedIn = isAuthenticated && accountType === 'consumer'
  const [step, setStep] = useState('service')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState(null)
  const [hours, setHours] = useState(null)

  const [reviews, setReviews] = useState(null)
  const [reviewsFailed, setReviewsFailed] = useState(false)

  useEffect(() => { getPublicHours().then(setHours).catch(() => {}) }, [])
  const loadReviews = () => getReviews().then(d => { setReviews(d); setReviewsFailed(false) }).catch(() => setReviewsFailed(true))
  useEffect(() => { loadReviews() }, [])

  function handleServiceSelect(service) {
    setSelectedService(service)
    setStep('date')
  }

  async function handleDateSelect(date) {
    setSelectedDate(date)
    setSlotsLoading(true)
    setError(null)
    try {
      const data = await getSlots(date, selectedService.id)
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
    setError(null)
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
    } catch (e) {
      if (e?.error === 'SLOT_TAKEN') {
        // Someone else got that time first: go back to the time step with fresh availability.
        setSlots(e.slots || [])
        setSelectedSlot(null)
        setStep('slot')
        setError(t('slotTaken'))
      } else {
        setError(t('bookingFailed'))
      }
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
      <div className="w-full max-w-xl lg:max-w-6xl">
        <StoreHeader tenant={tenant} hours={hours} compact={step !== 'service'} rating={reviews} />
        {/* Mobile: one column in DOM order. Desktop: booking flow + reviews on the left, store info sticky on the right. */}
        <div className="px-4 sm:px-0 pb-12 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-10 lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">

        {step === 'service' && <Gallery urls={tenant.galleryUrls} />}

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
            <DatePicker serviceId={selectedService.id} onSelect={handleDateSelect} />
          </div>
        )}

        {step === 'slot' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {serviceSummary} &mdash; {fmtDate(selectedDate)}
            </p>
            {hours && (() => {
              const day = hoursOnDate(hours, selectedDate)
              return <p className="text-sm font-semibold text-gray-800 mb-4">{day ? t('hoursOnDay', { open: day.open, close: day.close }) : t('closedOnDay')}</p>
            })()}
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <SlotGrid slots={slots} loading={slotsLoading} onSelect={handleSlotSelect} />
          </div>
        )}

        {step === 'form' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {serviceSummary} &mdash; {selectedSlot.substring(11, 16)} &middot; {fmtDate(selectedDate)}
            </p>
            <CheckoutForm onSubmit={handleFormSubmit} error={error} knownName={signedIn ? user.name || '' : ''} knownPhone={signedIn ? user.phone || '' : ''} />
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

        {/* On mobile the info only shows on the first step; on desktop the sidebar stays put through the flow. */}
        <aside className={`lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-20 ${step === 'service' ? '' : 'hidden lg:block'}`}>
          <StoreInfo tenant={tenant} hours={hours} />
        </aside>

        {step === 'service' && (
          <div className="lg:col-start-1 lg:row-start-2">
            <Reviews data={reviews} failed={reviewsFailed} onSubmitted={loadReviews} />
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
