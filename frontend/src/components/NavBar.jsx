import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth0 } from '../mockAuth'
import { useI18n } from '../i18n'
import LanguageToggle from './LanguageToggle'

const linkCls = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`
const mobileLinkCls = ({ isActive }) =>
  `block px-4 py-3 rounded-lg text-base font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-800 hover:bg-gray-50'}`

export default function NavBar() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth0()
  const [open, setOpen] = useState(false)

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim())
  const isAdmin = isAuthenticated && adminEmails.includes(user?.email)

  // Escape closes the mobile menu
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleLogout() {
    setOpen(false)
    sessionStorage.removeItem('role')
    try { logout() } finally { navigate('/', { replace: true }) }
  }

  const close = () => setOpen(false)

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2 text-lg font-bold text-gray-900 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">S</span>
          <span>ServiceBooking</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={linkCls}>{t('navHome')}</NavLink>
          {isAuthenticated && !isAdmin && <NavLink to="/auth/routing" className={linkCls}>{t('myArea')}</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkCls}>{t('admin')}</NavLink>}
          <LanguageToggle />
          {isAuthenticated ? (
            <button onClick={handleLogout} className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              {t('logout')}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">{t('login')}</Link>
              <Link to="/signup" className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">{t('signup')}</Link>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageToggle />
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t(open ? 'closeMenu' : 'openMenu')}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="md:hidden fixed inset-0 top-14 bg-black/30" onClick={close} aria-hidden="true" />
          <div id="mobile-menu" className="md:hidden absolute left-0 right-0 top-14 bg-white border-b border-gray-100 shadow-lg px-3 py-3 flex flex-col gap-1">
            <NavLink to="/" end onClick={close} className={mobileLinkCls}>{t('navHome')}</NavLink>
            {isAuthenticated && !isAdmin && <NavLink to="/auth/routing" onClick={close} className={mobileLinkCls}>{t('myArea')}</NavLink>}
            {isAdmin && <NavLink to="/admin" onClick={close} className={mobileLinkCls}>{t('admin')}</NavLink>}
            <div className="border-t border-gray-100 mt-2 pt-3 px-1 flex flex-col gap-2">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="w-full py-3 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  {t('logout')}
                </button>
              ) : (
                <>
                  <Link to="/signup" onClick={close} className="w-full text-center py-3 bg-indigo-600 text-white text-base font-medium rounded-lg hover:bg-indigo-700">{t('signup')}</Link>
                  <Link to="/login" onClick={close} className="w-full text-center py-3 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">{t('login')}</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
