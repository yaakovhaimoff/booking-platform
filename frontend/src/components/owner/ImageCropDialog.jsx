import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { useI18n } from '../../i18n'

// Shows the photo at imageUrl (owned and released by the caller). Lets the owner drag and zoom a chosen photo inside a fixed frame before it is uploaded.
export default function ImageCropDialog({ imageUrl, aspect, round = false, progress = null, onConfirm, onCancel }) {
  const { t } = useI18n()
  const title = progress ? `${t('photoCropTitle')} (${progress.index}/${progress.total})` : t('photoCropTitle')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState(null)

  const rememberArea = useCallback((_, pixels) => setArea(pixels.width > 0 && pixels.height > 0 ? pixels : null), [])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mb-3">{t('photoCropHint')}</p>
        <div className="relative w-full h-72 bg-gray-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={round ? 'round' : 'rect'}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={rememberArea}
          />
        </div>
        <label className="flex items-center gap-3 mt-4 h-5 text-sm text-gray-700">
          {t('photoZoom')}
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            aria-label={t('photoZoom')}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </label>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition">
            {t('cancel')}
          </button>
          <button type="button" disabled={!area} onClick={() => onConfirm(area)}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition disabled:opacity-60">
            {t('photoCropConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
