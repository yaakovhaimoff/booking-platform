import { useEffect, useRef, useState } from 'react'
import { CloseIcon, MenuIcon } from './icons'
import Logo from './Logo'
import { useI18n } from '../../i18n'

// "Menu" pill button. Desktop: dropdown anchored under the header. Mobile (<=480px): full-screen overlay.
// children: a render function receiving close(), or plain nodes.
export default function HeaderMenu({ children, logoTo = '/', iconOnlyOnMobile = true }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [open])

  // Lock page scroll while the mobile overlay is up
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 480px)').matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="header-menu"
        aria-label={t('pMenu')}
        className="h-11 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition max-[480px]:w-11 max-[480px]:justify-center max-[480px]:border-0 max-[480px]:bg-transparent max-[480px]:px-0"
      >
        <span className={iconOnlyOnMobile ? 'max-[480px]:hidden' : ''}>{t('pMenu')}</span>
        <MenuIcon size={20} />
      </button>

      {open && (
        <div
          id="header-menu"
          className="z-50 bg-white overflow-y-auto
            absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl border border-gray-100 shadow-xl p-5
            max-[480px]:fixed max-[480px]:inset-0 max-[480px]:w-auto max-[480px]:rounded-none max-[480px]:border-0 max-[480px]:shadow-none max-[480px]:p-0 max-[480px]:bg-gray-50"
        >
          <div className="hidden max-[480px]:flex h-14 items-center justify-between px-4 bg-white border-b border-gray-100">
            <Logo to={logoTo} onClick={close} />
            <button onClick={close} aria-label={t('pCloseMenu')} className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100">
              <CloseIcon size={22} />
            </button>
          </div>
          <div className="max-[480px]:p-4 max-[480px]:flex max-[480px]:flex-col max-[480px]:gap-4">
            {typeof children === 'function' ? children(close) : children}
          </div>
        </div>
      )}
    </div>
  )
}
