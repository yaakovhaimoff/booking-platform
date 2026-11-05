import { useI18n } from '../../i18n'
import { OWNER_TABS } from './ownerTabs'

// Desktop sidebar. On mobile the same tabs live in the navbar menu (see NavBar).
export default function DashboardNav({ activeTab, onTabChange }) {
  const { t } = useI18n()
  return (
    <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 sticky top-20 self-start bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
      {OWNER_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === tab.id
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {t(tab.label)}
        </button>
      ))}
    </nav>
  )
}
