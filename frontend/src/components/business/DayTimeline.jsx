import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n'
import Reveal from './Reveal'
import { BookingSlotsMockup, RequestCard, RequestStack, ReviewsMockup, TomorrowMockup } from './LandingVisuals'

const SCENE_VISUALS = [RequestStack, () => <RequestCard name={0} svc={0} tapping />, BookingSlotsMockup, ReviewsMockup, TomorrowMockup]

const SKIES = [
  'linear-gradient(180deg,#ffe0e2 0%,#fbcfe8 55%,#fde7c8 100%)',
  'linear-gradient(180deg,#c7d9ff 0%,#e0ecff 60%,#fff1e0 100%)',
  'linear-gradient(180deg,#8fb8ff 0%,#cfe2ff 70%,#f0f6ff 100%)',
  'linear-gradient(180deg,#e0606b 0%,#f19bb5 60%,#ffc58f 100%)',
  'linear-gradient(180deg,#1c0a0d 0%,#7a0f17 70%,#e0606b 100%)',
]

const SCROLL_PER_ITEM = 70
const clamp = (value, low, high) => Math.min(high, Math.max(low, value))
const toMinutes = time => { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
const formatClock = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}`
const prefersReducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Heading({ light, bold, className = '' }) {
  return (
    <h2 className={`font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.03em] text-gray-950 ${className}`}>
      <span className="block font-normal">{light}</span>
      <span className="block font-extrabold">{bold}</span>
    </h2>
  )
}

function StackedDay({ scenes, light, bold }) {
  return (
    <section id="day" className="mx-3 sm:mx-6 mt-24 rounded-[32px] bg-brand-50/70 py-20 sm:py-28">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10">
        <Heading light={light} bold={bold} className="text-center" />
        <div className="mt-16 flex flex-col gap-20">
          {scenes.map((scene, index) => {
            const Visual = SCENE_VISUALS[index]
            return (
              <div key={scene.time} className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${index % 2 ? 'md:[&>:first-child]:order-2' : ''}`}>
                <Reveal>
                  <span className="inline-flex rounded-2xl bg-white px-5 py-2 font-display text-3xl font-extrabold tracking-tight text-brand-600 shadow-sm">{scene.time}</span>
                  <h3 className="mt-5 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">{scene.title}</h3>
                  <p className="mt-3 max-w-md text-lg text-gray-600">{scene.body}</p>
                </Reveal>
                <Reveal delay={150} className="rounded-3xl bg-gradient-to-br from-white/70 to-brand-100/60 p-5 sm:p-8"><Visual /></Reveal>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// A tall section with a pinned stage: scrolling down slides the day's cards sideways, the clock runs
// from morning to night and the sky changes colour.
function ScrollingDay({ scenes, light, bold }) {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const trackRef = useRef(null)
  const clockRef = useRef(null)
  const barRef = useRef(null)
  const skyRefs = useRef([])
  const itemCount = scenes.length + 1

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const track = trackRef.current
    const items = [...track.children]
    const minutes = scenes.map(scene => toMinutes(scene.time))
    let centers = []
    let frame = 0

    const measure = () => { centers = items.map(item => item.offsetLeft + item.offsetWidth / 2) }
    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const distance = rect.height - stage.offsetHeight
      const progress = distance > 0 ? clamp(-rect.top / distance, 0, 1) : 0
      const position = progress * (items.length - 1)
      const low = Math.floor(position)
      const high = Math.min(low + 1, items.length - 1)
      const fraction = position - low
      const center = (centers[low] ?? 0) + ((centers[high] ?? 0) - (centers[low] ?? 0)) * fraction
      track.style.transform = `translate3d(${stage.offsetWidth / 2 - center}px,0,0)`
      items.forEach((item, index) => {
        const distanceToCenter = Math.min(Math.abs(position - index), 1.5)
        item.style.opacity = String(1 - distanceToCenter * 0.4)
        item.style.transform = `scale(${1 - Math.min(distanceToCenter, 1) * 0.1})`
      })
      const scenePosition = Math.max(0, position - 1)
      skyRefs.current.forEach((layer, index) => { if (layer) layer.style.opacity = String(clamp(1 - Math.abs(scenePosition - index), 0, 1)) })
      const sceneLow = Math.min(Math.floor(scenePosition), minutes.length - 1)
      const sceneHigh = Math.min(sceneLow + 1, minutes.length - 1)
      const clock = minutes[sceneLow] + (minutes[sceneHigh] - minutes[sceneLow]) * (scenePosition - sceneLow)
      clockRef.current.textContent = formatClock(clock)
      barRef.current.style.transform = `scaleX(${progress})`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const remeasure = () => { measure(); update() }

    remeasure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [scenes])

  return (
    <section ref={sectionRef} id="day" className="relative scroll-mt-[92px] mx-3 sm:mx-6 mt-24" style={{ height: `${(itemCount - 1) * SCROLL_PER_ITEM + 100}vh` }}>
      <div ref={stageRef} className="sticky top-[92px] h-[calc(100svh-104px)] min-h-[540px] overflow-hidden rounded-[32px]">
        {SKIES.map((sky, index) => (
          <div key={sky} ref={element => { skyRefs.current[index] = element }} className="absolute inset-0" style={{ background: sky, opacity: index ? 0 : 1 }} aria-hidden="true" />
        ))}
        <div className="absolute inset-x-0 top-6 z-10 flex justify-center sm:top-8" aria-hidden="true">
          <div className="rounded-2xl bg-white/70 px-8 py-3 text-center shadow-lg backdrop-blur-md">
            <span ref={clockRef} data-testid="day-clock" className="block font-display text-4xl font-extrabold tabular-nums tracking-tight text-gray-950 sm:text-5xl">{scenes[0].time}</span>
            <span className="mt-2 block h-1 w-40 overflow-hidden rounded-full bg-gray-200"><span ref={barRef} className="block h-full origin-left bg-gray-950" style={{ transform: 'scaleX(0)' }} /></span>
          </div>
        </div>
        <div ref={trackRef} className="relative flex h-full items-center gap-6 will-change-transform sm:gap-8">
          <div className="w-[min(82vw,460px)] shrink-0 px-2"><Heading light={light} bold={bold} /></div>
          {scenes.map((scene, index) => {
            const Visual = SCENE_VISUALS[index]
            return (
              <article key={scene.time} className="w-[min(82vw,400px)] shrink-0 rounded-3xl bg-white/75 p-5 shadow-xl backdrop-blur-md sm:p-6">
                <Visual />
                <p className="mt-5 text-sm font-bold text-brand-600">{scene.time}</p>
                <h3 className="mt-1 text-2xl font-extrabold leading-tight text-gray-950">{scene.title}</h3>
                <p className="mt-2 text-gray-600">{scene.body}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function DayTimeline() {
  const { t } = useI18n()
  const scenes = t('bzScenes')
  const props = { scenes, light: t('bzDayLight'), bold: t('bzDayBold') }
  return prefersReducedMotion() ? <StackedDay {...props} /> : <ScrollingDay {...props} />
}
