import { useRef } from 'react'
import VenueCard from './VenueCard'
import { ArrowRightIcon } from '../shared/icons'

// Horizontal scroll-snap carousel: swipes on touch, arrow button on desktop.
export default function VenueCarousel({ title, venues }) {
  const ref = useRef(null)
  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-12" aria-label={title}>
      <h2 className="text-2xl font-bold text-gray-900 mb-5">{title}</h2>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {venues.map(v => <VenueCard key={v.id ?? v.slug} venue={v} />)}
        </div>
        <button
          type="button"
          aria-label={`Scroll ${title} forward`}
          onClick={() => ref.current?.scrollBy({ left: 320, behavior: 'smooth' })}
          className="hidden sm:flex absolute -right-5 top-20 w-11 h-11 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 hover:bg-gray-50"
        >
          <ArrowRightIcon size={20} />
        </button>
      </div>
    </section>
  )
}
