import { useState } from 'react'
import { useI18n } from '../i18n'

export default function CheckoutForm({ onSubmit, error }) {
  const { t } = useI18n()
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const errors = {}
    if (!clientName.trim()) {
      errors.clientName = 'nameRequired'
    } else if (clientName.trim().length > 100) {
      errors.clientName = 'nameTooLong'
    }
    if (!clientPhone.trim()) {
      errors.clientPhone = 'phoneRequired'
    } else if (!/^\d+$/.test(clientPhone.trim())) {
      errors.clientPhone = 'phoneDigits'
    }
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    try {
      await onSubmit(clientName.trim(), clientPhone.trim(), notes.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {fieldErrors.clientName && (
          <p className="text-red-600 text-xs mt-1">{t(fieldErrors.clientName)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
        <input
          type="text"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {fieldErrors.clientPhone && (
          <p className="text-red-600 text-xs mt-1">{t(fieldErrors.clientPhone)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('notes')} <span className="text-gray-400 font-normal">{t('optional')}</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t('notesPlaceholder')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-100 rounded-b-lg flex flex-col gap-2">
        <p className="text-xs text-gray-500 text-center">{t('approvalNote')}</p>
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? t('booking') : t('confirmBooking')}
        </button>
      </div>
    </form>
  )
}
