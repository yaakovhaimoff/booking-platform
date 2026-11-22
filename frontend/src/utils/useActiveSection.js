import { useEffect, useState } from 'react'

// The id of the last section (in the given order) whose top has reached `offset` pixels from the
// top of the viewport, or null while none has.
export function useActiveSection(ids, offset = 140) {
  const [active, setActive] = useState(null)
  const key = ids.join(',')
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current = null
      key.split(',').forEach(id => {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= offset) current = id
      })
      setActive(current)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [key, offset])
  return active
}
