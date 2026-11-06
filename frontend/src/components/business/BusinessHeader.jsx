import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../shared/Logo'
import HeaderMenu from '../shared/HeaderMenu'
import { MenuGroup, MenuItem, MenuSwitchRow } from '../shared/MenuParts'
import LanguageToggle from '../LanguageToggle'
import { ChevronDownIcon, GlobeIcon, StoreIcon } from '../shared/icons'
import { useI18n } from '../../i18n'

function NavDropdown({ label, items, anchor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown); window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-indigo-600">
        {label}<ChevronDownIcon size={16} />
      </button>
      {open && (
        <ul className="absolute left-0 top-[calc(100%+12px)] w-60 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          {items.map(i => (
            <li key={i}><a href={anchor} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-gray-800 hover:bg-indigo-50">{i}</a></li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Business-world header. Deliberately has no consumer search, gift cards or consumer login.
export default function BusinessHeader() {
  const { t } = useI18n()
  return (
    <header className="relative z-40 w-full bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-10">
          <Logo to="/for-business" />
          <nav className="hidden lg:flex items-center gap-7" aria-label="Business">
            <NavDropdown label={t('pBusinessTypes')} items={t('pBizTypes')} anchor="#features" />
            <NavDropdown label={t('pFeatures')} items={t('pBizFeatures')} anchor="#features" />
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" className="hidden md:inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            <StoreIcon size={18} />{t('pMarketplace')}
          </Link>
          <Link to="/partner" className="inline-flex h-11 items-center rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white hover:bg-gray-800 transition">{t('pSignUp')}</Link>
          <HeaderMenu logoTo="/for-business">
            {close => (
              <>
                <MenuGroup title={t('pForBusinesses')}>
                  <MenuItem to="/partner" onClick={close} active>{t('pLogInOrSignUp')}</MenuItem>
                  <MenuItem href="#features" onClick={close}>{t('pBusinessTypes')}</MenuItem>
                  <MenuItem href="#features" onClick={close}>{t('pFeatures')}</MenuItem>
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
      </div>
    </header>
  )
}
