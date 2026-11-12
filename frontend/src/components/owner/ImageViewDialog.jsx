import { useEffect } from 'react'
import { useI18n } from '../../i18n'

// Same frame, size and position as ImageCropDialog, so pressing Edit only adds the zoom slider and the
// confirm button to what is already on screen.
export default function ImageViewDialog({ url, busy = false, onEdit, onClose }) {
  const { t } = useI18n()

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t('photoView')} onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900">{t('photoView')}</h2>
        <p className="text-sm text-gray-500 mb-3">{t('photoViewHint')}</p>
        <div className="relative w-full h-72 bg-gray-900 rounded-lg overflow-hidden">
          <img src={url} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="h-5 mt-4" aria-hidden="true" />
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition">
            {t('closeQr')}
          </button>
          <button type="button" disabled={busy} onClick={onEdit}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition disabled:opacity-60">
            {t('photoEdit')}
          </button>
        </div>
      </div>
    </div>
  )
}
