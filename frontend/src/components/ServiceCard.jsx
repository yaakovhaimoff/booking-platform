export default function ServiceCard({ service, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{service.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{service.durationMinutes} min</p>
        </div>
        <span className="text-base font-medium text-purple-600">${service.price.toFixed(2)}</span>
      </div>
    </button>
  )
}
