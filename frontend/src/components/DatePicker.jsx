export default function DatePicker({ onSelect }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select a date</label>
      <input
        type="date"
        min={today}
        onChange={(e) => e.target.value && onSelect(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
    </div>
  )
}
