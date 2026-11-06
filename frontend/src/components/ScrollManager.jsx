import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const KEY = 'scroll-positions'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {} } catch { return {} } }
const write = obj => { try { sessionStorage.setItem(KEY, JSON.stringify(obj)) } catch { /* storage full/disabled */ } }

// Remembers the scroll position of every history entry. Back/forward/refresh return to where
// you were (waiting briefly for async content to make the page tall enough); a fresh link
// opens at the top, or at the #anchor if there is one.
export default function ScrollManager() {
  const location = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    const save = () => write({ ...read(), [location.key]: window.scrollY })
    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('pagehide', save)
    return () => { save(); window.removeEventListener('scroll', save); window.removeEventListener('pagehide', save) }
  }, [location.key])

  useLayoutEffect(() => {
    const saved = navType === 'POP' ? read()[location.key] : undefined
    if (saved == null) {
      const el = location.hash && document.getElementById(location.hash.slice(1))
      if (el) el.scrollIntoView(); else window.scrollTo(0, 0)
      return
    }
    let tries = 0
    const timer = setInterval(() => {
      window.scrollTo(0, saved)
      if (Math.abs(window.scrollY - saved) < 2 || ++tries > 20) clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [location.key, location.hash, navType])

  return null
}
