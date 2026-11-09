import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../i18n'
import StorePreviewFrame from './StorePreviewFrame'

function DeviceMenu({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = options.find(o => o.id === value)

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {current.label}
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.500-4.500" stroke="currentColor" strokeWidth="1.800" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 top-full mt-1 min-w-full w-36 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10">
          {options.map(o => (
            <li key={o.id} role="option" aria-selected={o.id === value}>
              <button
                type="button"
                onClick={() => { onChange(o.id); setOpen(false) }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md text-left ${o.id === value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {o.label}
                {o.id === value && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function StorePreviewModal({ slug, draft, onClose }) {
  const { t } = useI18n()
  const [device, setDevice] = useState('mobile')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col" role="dialog" aria-modal="true" aria-label={t('previewTitle')}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">{t('previewTitle')}</h2>
        <DeviceMenu
          value={device}
          onChange={setDevice}
          options={[{ id: 'mobile', label: t('previewMobile') }, { id: 'desktop', label: t('previewDesktop') }]}
        />
        <button onClick={onClose} className="ml-auto px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">{t('previewClose')}</button>
      </div>
      <div className="flex-1 min-h-0 p-4 overscroll-contain">
        <StorePreviewFrame slug={slug} draft={draft} device={device} fitHeight />
      </div>
    </div>,
    document.body
  )
}
