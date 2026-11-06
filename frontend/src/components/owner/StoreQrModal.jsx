import { useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useI18n } from '../../i18n'

// Large, scannable QR for the store link: print it, save it as an image, or share the link.
export default function StoreQrModal({ url, name, onClose }) {
  const { t } = useI18n()
  const canvasRef = useRef(null)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const dataUrl = () => canvasRef.current.toDataURL('image/png')

  function download() {
    const a = document.createElement('a')
    a.href = dataUrl()
    a.download = `${(name || 'store').replace(/[^\w-]+/g, '-')}-qr.png`
    a.click()
  }

  function print() {
    const w = window.open('', '_blank', 'width=600,height=800')
    if (!w) return
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    w.document.write(`<!doctype html><title>${esc(name)}</title>
      <body style="font-family:sans-serif;text-align:center;padding:48px">
      <h1 style="margin:0 0 8px">${esc(name)}</h1>
      <p style="color:#555;margin:0 0 32px">${esc(t('scanToBook'))}</p>
      <img src="${dataUrl()}" style="width:360px;height:360px" onload="window.print();window.close()">
      <p style="color:#555;margin-top:24px;word-break:break-all">${esc(url)}</p></body>`)
    w.document.close()
  }

  const canShare = typeof navigator.share === 'function'
  const share = () => navigator.share({ title: name, url }).catch(() => {})

  const btn = 'flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('scanToBook')}</p>
        <div className="inline-block border border-gray-200 rounded-lg p-3">
          <QRCodeCanvas ref={canvasRef} value={url} size={512} marginSize={1} style={{ width: 224, height: 224 }} />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={print} className={btn}>{t('printQr')}</button>
          <button onClick={download} className={btn}>{t('downloadQr')}</button>
          {canShare && <button onClick={share} className={btn}>{t('shareQr')}</button>}
        </div>
        <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700">{t('closeQr')}</button>
      </div>
    </div>
  )
}
