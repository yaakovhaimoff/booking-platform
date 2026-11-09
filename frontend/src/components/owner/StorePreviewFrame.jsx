import { useRef, useState, useEffect, useLayoutEffect } from 'react'

export const DEVICES = {
  mobile: { w: 390, h: 760 },
  desktop: { w: 1280, h: 800 },
}

// The public store page in an iframe (so it gets a real viewport and breakpoints), scaled to fit
// its container. The unsaved draft is pushed in via postMessage; see PublicStorePage.
export default function StorePreviewFrame({ slug, draft, device = 'mobile', fitHeight = false }) {
  const { w, h } = DEVICES[device]
  const mobile = device === 'mobile'
  const boxRef = useRef(null)
  const iframeRef = useRef(null)
  const draftRef = useRef(draft)
  const [avail, setAvail] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setAvail({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const send = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'store-preview', tenant: draftRef.current }, window.location.origin)
  }

  // Push every change (debounced a touch so typing stays smooth)
  useEffect(() => {
    draftRef.current = draft
    const id = setTimeout(send, 120)
    return () => clearTimeout(id)
  }, [draft])

  // The page announces itself once it can listen; send the current draft then
  useEffect(() => {
    const onMessage = e => {
      if (e.origin === window.location.origin && e.source === iframeRef.current?.contentWindow && e.data?.type === 'store-preview-ready') send()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  let scale = avail.w ? Math.min(1, avail.w / w) : 1
  if (fitHeight && avail.h) scale = Math.min(scale, avail.h / h)

  return (
    <div ref={boxRef} className={`flex justify-center ${fitHeight ? 'h-full items-center' : ''}`}>
      <div style={{ width: w * scale, height: h * scale }}>
        <div
          className={`bg-white overflow-hidden shadow-lg border-gray-800 ${mobile ? 'rounded-[2rem] border-[10px]' : 'rounded-lg border-2'}`}
          style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', boxSizing: 'border-box' }}
        >
          <iframe ref={iframeRef} src={`/store/${slug}`} title="Store preview" className="w-full h-full block" />
        </div>
      </div>
    </div>
  )
}
