import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '../../auth'
import { useI18n } from '../../i18n'
import { OWNER_TABS } from './ownerTabs'
import SideNav from '../shared/SideNav'
import { usePendingCount } from '../../pendingStore'

export default function DashboardNav({ activeTab, onTabChange }) {
  const { t } = useI18n()
  const { logout } = useAuth0()
  const navigate = useNavigate()
  const pending = usePendingCount()

  function handleLogout() {
    sessionStorage.removeItem('role')
    try { logout() } finally { navigate('/partner', { replace: true }) }
  }

  return (
    <SideNav
      items={OWNER_TABS.map(x => ({ id: x.id, label: t(x.label), badge: x.id === 'queue' ? pending : 0 }))}
      active={activeTab}
      onSelect={onTabChange}
      onLogout={handleLogout}
      logoutLabel={t('logout')}
      label="Dashboard"
      className="sticky top-14 h-[calc(100vh-3.5rem)] md:-mt-8 -mt-6"
    />
  )
}
