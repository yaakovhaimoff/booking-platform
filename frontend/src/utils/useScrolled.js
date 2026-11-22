import { useEffect, useRef } from 'react'

// Sets a data-scrolled attribute on the returned element once the page is scrolled past `threshold`
// pixels, so CSS can animate between the two states without re-rendering on every scroll.
export function useScrolled(threshold = 40) {
  const ref = useRef(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const element = ref.current
      if (!element) return
      if (window.scrollY > threshold) element.setAttribute('data-scrolled', '')
      else element.removeAttribute('data-scrolled')
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [threshold])
  return ref
}
