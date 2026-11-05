import { useI18n } from '../../i18n'

const TABS = [
  { id: 'store',    label: 'tabStore' },
  { id: 'queue',    label: 'tabAppointments' },
  { id: 'services', label: 'tabServices' },
  { id: 'hours',    label: 'tabHours' },
]

export default function DashboardNav({ activeTab, onTabChange }) {
  const { t } = useI18n()
  return (
    <nav className="flex overflow-x-auto border-b border-gray-200 mb-6">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t(tab.label)}
        </button>
      ))}
    </nav>
  )
}
