import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth0 } from '../../mockAuth'
import { useI18n } from '../../i18n'
import Logo from '../shared/Logo'
import HeaderMenu from '../shared/HeaderMenu'
import { MenuGroup, MenuItem, MenuSwitchRow } from '../shared/MenuParts'
import LanguageToggle from '../LanguageToggle'
import { GlobeIcon } from '../shared/icons'

// Consumer-world header. Business navigation lives only in the "For businesses" button
// and the menu's separate "For businesses" row.
export default function ConsumerHeader() {
  const { isAuthenticated, accountType, logout } = useAuth0()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const onProfile = pathname === '/client/dashboard' && search.includes('tab=profile')
  const onBookings = pathname === '/client/dashboard' && !onProfile
  // A business session is invisible here: the consumer site only reflects consumer accounts.
  const signedIn = isAuthenticated && accountType === 'consumer'

  function handleLogout(close) {
    close()
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          {!signedIn && (
            <>
              <Link to="/user-flow" className="hidden sm:inline text-sm font-semibold text-gray-900 hover:text-indigo-600 px-2">{t('pLogIn')}</Link>
              <Link
                to="/for-business"
                className="hidden sm:inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition"
              >
                {t('pForBusinesses')}
              </Link>
            </>
          )}
          <HeaderMenu>
            {close => (
              <>
                <MenuGroup title={t('pForCustomers')}>
                  {signedIn ? (
                    <>
                      <MenuItem to="/client/dashboard" onClick={close} active={onBookings}>{t('pMyBookings')}</MenuItem>
                      <MenuItem to="/client/dashboard?tab=profile" onClick={close} active={onProfile}>{t('pProfile')}</MenuItem>
                      <MenuItem onClick={() => handleLogout(close)}>{t('pLogOut')}</MenuItem>
                    </>
                  ) : (
                    <MenuItem to="/user-flow" onClick={close} active>{t('pLogInOrSignUp')}</MenuItem>
                  )}
                  <MenuItem to="/help" onClick={close}>{t('pHelp')}</MenuItem>
                  <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex items-center gap-3 text-gray-800"><GlobeIcon size={18} />{t('pLangName')}</span>
                    <LanguageToggle />
                  </li>
                </MenuGroup>
                {!signedIn && <MenuSwitchRow to="/for-business" onClick={close}>{t('pForBusinesses')}</MenuSwitchRow>}
              </>
            )}
          </HeaderMenu>
        </div>
      </div>
    </header>
  )
}
