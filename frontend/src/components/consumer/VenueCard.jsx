import { Link } from 'react-router-dom'

// Flat soft tones (no gradients) for shops without a profile photo; the initial does the work.
const TONES = ['bg-brand-200 text-brand-700', 'bg-cta-100 text-cta-700', 'bg-brand-100 text-brand-600', 'bg-cta-50 text-cta-600', 'bg-brand-600 text-brand-100']

export default function VenueCard({ venue }) {
  const label = venue.name || venue.slug || ''
  const tone = TONES[[...(venue.slug || label)].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]
  return (
    <Link to={`/store/${venue.slug}`} className="group block w-[250px] sm:w-[280px] shrink-0 snap-start">
      {venue.logoUrl ? (
        <div className="aspect-[4/5] rounded-xl bg-cover bg-center" style={{ backgroundImage: `url("${venue.logoUrl}")` }} />
      ) : (
        <div className={`aspect-[4/5] rounded-xl flex items-end p-5 font-display font-extrabold text-8xl leading-none ${tone}`} aria-hidden="true">
          {label.charAt(0).toLowerCase()}
        </div>
      )}
      <h3 className="mt-3 font-display text-lg font-bold text-gray-950 group-hover:text-brand-600 truncate">{label}</h3>
      {venue.address && <p className="text-sm text-gray-600 truncate">{venue.address}</p>}
    </Link>
  )
}
