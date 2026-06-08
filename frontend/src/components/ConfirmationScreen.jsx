export default function ConfirmationScreen({ appointment, serviceName, onBookAnother }) {
  const formatDateTime = (iso) => {
    const [date, time] = iso.split('T')
    return `${date} at ${time.substring(0, 5)}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Appointment Booked!</h2>

      <dl className="text-left space-y-3 mb-6">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Service</dt>
          <dd className="text-sm font-medium text-gray-800">{serviceName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Start</dt>
          <dd className="text-sm font-medium text-gray-800">{formatDateTime(appointment.startTime)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">End</dt>
          <dd className="text-sm font-medium text-gray-800">{formatDateTime(appointment.endTime)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Name</dt>
          <dd className="text-sm font-medium text-gray-800">{appointment.clientName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Status</dt>
          <dd>
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {appointment.status}
            </span>
          </dd>
        </div>
      </dl>

      <button
        onClick={onBookAnother}
        className="w-full bg-purple-600 text-white rounded-md py-2 font-medium hover:bg-purple-700 transition-colors"
      >
        Book another
      </button>
    </div>
  )
}
