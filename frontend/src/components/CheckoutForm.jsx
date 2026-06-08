import { useState } from 'react'

export default function CheckoutForm({ onSubmit, error }) {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const errors = {}
    if (!clientName.trim()) {
      errors.clientName = 'Name is required.'
    } else if (clientName.trim().length > 100) {
      errors.clientName = 'Name must be 100 characters or fewer.'
    }
    if (!clientPhone.trim()) {
      errors.clientPhone = 'Phone is required.'
    } else if (!/^\d+$/.test(clientPhone.trim())) {
      errors.clientPhone = 'Phone must contain digits only.'
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
      await onSubmit(clientName.trim(), clientPhone.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        {fieldErrors.clientName && (
          <p className="text-red-600 text-xs mt-1">{fieldErrors.clientName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
        <input
          type="text"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        {fieldErrors.clientPhone && (
          <p className="text-red-600 text-xs mt-1">{fieldErrors.clientPhone}</p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-purple-600 text-white rounded-md py-2 font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  )
}
