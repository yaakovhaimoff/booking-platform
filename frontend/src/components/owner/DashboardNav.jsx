const TABS = [
  { id: 'store',    label: 'Store' },
  { id: 'queue',    label: 'Appointments' },
  { id: 'services', label: 'Services' },
  { id: 'hours',    label: 'Hours' },
]

export default function DashboardNav({ activeTab, onTabChange }) {
  return (
    <nav className="flex border-b border-gray-200 mb-6">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
