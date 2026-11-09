import { useState, useRef, useLayoutEffect } from 'react'
import { useI18n } from '../../i18n'

const DESKTOP_W = 1280
const DESKTOP_H = 800
const MOBILE_W = 390
const MOBILE_H = 760

export default function StorePreviewTab({ tenant }) {
  const { t } = useI18n()
  const [device, setDevice] = useState('mobile')
  const [version, setVersion] = useState(0)
  const [avail, setAvail] = useState(0)
  const boxRef = useRef(null)
  const url = `/store/${tenant.slug}`
  const mobile = device === 'mobile'

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => {
      const cs = getComputedStyle(el)
      setAvail(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Desktop: render the page at a real desktop width, then scale it down to fit the panel.
  const scale = mobile ? 1 : Math.min(1, avail / DESKTOP_W) || 1
  const frameW = mobile ? MOBILE_W : DESKTOP_W
  const frameH = mobile ? MOBILE_H : DESKTOP_H

  const btn = active => `px-3 py-1.5 text-sm font-medium rounded-lg transition ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{t('previewHint')}</p>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button className={btn(mobile)} onClick={() => setDevice('mobile')}>{t('previewMobile')}</button>
        <button className={btn(!mobile)} onClick={() => setDevice('desktop')}>{t('previewDesktop')}</button>
        <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setVersion(v => v + 1)}>{t('previewReload')}</button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm text-indigo-600 hover:underline">{t('previewOpen')} ↗</a>
      </div>
      <div ref={boxRef} className="bg-gray-100 rounded-xl p-3 sm:p-6 flex justify-center overflow-hidden">
        <div style={{ width: frameW * scale, height: frameH * scale, maxWidth: '100%' }}>
          <div
            className={`bg-white overflow-hidden shadow-lg border-gray-800 ${mobile ? 'rounded-[2rem] border-[10px]' : 'rounded-lg border-2'}`}
            style={{ width: frameW, height: frameH, transform: `scale(${scale})`, transformOrigin: 'top left', boxSizing: 'border-box' }}
          >
            <iframe
              key={`${device}-${version}`}
              src={url}
              title={t('tabPreview')}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
