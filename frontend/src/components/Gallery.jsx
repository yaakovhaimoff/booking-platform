import { useState } from 'react'
import { useI18n } from '../i18n'

// Image gallery from plain links. Links that fail to load are dropped silently.
export default function Gallery({ urls = [] }) {
  const { t } = useI18n()
  const [broken, setBroken] = useState(() => new Set())
  const [open, setOpen] = useState(null)
  const shown = urls.filter(u => !broken.has(u))
  if (shown.length === 0) return null

  const markBroken = u => setBroken(s => new Set(s).add(u))

  return (
    <>
      <div className="mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1" aria-label={t('gallery')}>
        {shown.map(u => (
          <button
            key={u}
            type="button"
            onClick={() => setOpen(u)}
            className="snap-start shrink-0 h-32 sm:h-40 rounded-xl overflow-hidden bg-gray-100"
          >
            <img src={u} alt="" loading="lazy" onError={() => markBroken(u)} className="h-full w-auto object-cover" />
          </button>
        ))}
      </div>
      {open && !broken.has(open) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <img src={open} alt="" className="max-h-full max-w-full rounded-lg" />
          <button type="button" aria-label={t('closeImage')} className="absolute top-4 right-4 text-white text-3xl leading-none">×</button>
        </div>
      )}
    </>
  )
}
