export default function SlotGrid({ slots, loading, onSelect }) {
  if (loading) {
    return <p className="text-center text-gray-500 py-8">Loading available slots...</p>
  }

  if (slots.length === 0) {
    return <p className="text-center text-gray-500 py-8">No available slots for this date.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((slot) => (
        <button
          key={slot}
          onClick={() => onSelect(slot)}
          className="bg-white border border-gray-200 rounded-md py-2 text-sm font-medium text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:shadow-sm transition-all"
        >
          {slot.substring(11, 16)}
        </button>
      ))}
    </div>
  )
}
