import { Link } from 'react-router-dom'
import Logo from '../shared/Logo'
import HeaderMenu from '../shared/HeaderMenu'
import { MenuGroup, MenuItem, MenuSwitchRow } from '../shared/MenuParts'
import LanguageToggle from '../LanguageToggle'
import { GlobeIcon, StoreIcon } from '../shared/icons'
import { useI18n } from '../../i18n'
import FloatingHeader from '../shared/FloatingHeader'
import { useActiveSection } from '../../utils/useActiveSection'

const SECTIONS = [
  { id: 'day', label: 'bzNavDay' },
  { id: 'features', label: 'pFeatures' },
  { id: 'steps', label: 'bzNavSteps' },
  { id: 'faq', label: 'bzNavFaq' },
]
const SECTION_IDS = SECTIONS.map(section => section.id)

// Business-world header. Deliberately has no consumer search, gift cards or consumer login.
// Floating pill (see FloatingHeader) whose link for the section on screen is highlighted.
export default function BusinessHeader() {
  const { t } = useI18n()
  const activeSection = useActiveSection(SECTION_IDS)
  return (
    <FloatingHeader barClassName="grid grid-cols-[auto_1fr] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
      <span className="bz-nav-logo"><Logo to="/for-business" /></span>
      <nav className="hidden lg:flex items-center gap-1" aria-label="Business">
        {SECTIONS.map(section => (
          <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? 'true' : undefined}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${activeSection === section.id ? 'bg-gray-100 text-gray-950' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'}`}>
            {t(section.label)}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3 justify-self-end">
        <Link to="/" className="hidden xl:inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 px-5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
          <StoreIcon size={18} />{t('pMarketplace')}
        </Link>
        <Link to="/partner" className="inline-flex h-11 items-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white hover:bg-gray-800 transition">{t('pSignUp')}</Link>
        <HeaderMenu logoTo="/for-business">
          {close => (
            <>
              <MenuGroup title={t('pForBusinesses')}>
                <MenuItem to="/partner" onClick={close} active>{t('pLogInOrSignUp')}</MenuItem>
                {SECTIONS.map(section => <MenuItem key={section.id} href={`#${section.id}`} onClick={close}>{t(section.label)}</MenuItem>)}
                <MenuItem to="/help" onClick={close}>{t('pHelp')}</MenuItem>
                <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex items-center gap-3 text-gray-800"><GlobeIcon size={18} />{t('pLangName')}</span>
                  <LanguageToggle />
                </li>
              </MenuGroup>
              <MenuSwitchRow to="/" onClick={close}>{t('pForCustomers')}</MenuSwitchRow>
            </>
          )}
        </HeaderMenu>
      </div>
    </FloatingHeader>
  )
}
