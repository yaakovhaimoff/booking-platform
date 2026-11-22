import { useEffect, useRef, useState } from 'react'

// True once the element has scrolled into view (and stays true). Without IntersectionObserver
// (old browsers, jsdom) the content is simply shown.
export function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const element = ref.current
    if (inView || !element) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect() }
    }, { threshold })
    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, threshold])
  return [ref, inView]
}
