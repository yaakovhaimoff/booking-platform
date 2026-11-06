import { Link } from 'react-router-dom'

// venue: { name, slug, address, coverUrl } from the API (a real shop)
export default function VenueCard({ venue }) {
  const hue = [...(venue.slug || venue.name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const cover = venue.coverUrl
    ? { backgroundImage: `url("${venue.coverUrl}")` }
    : { backgroundImage: `linear-gradient(135deg, hsl(${hue} 55% 38%), hsl(${(hue + 40) % 360} 60% 62%))` }
  return (
    <Link
      to={`/store/${venue.slug}`}
      className="group block w-[270px] sm:w-[300px] shrink-0 snap-start"
    >
      <div className="h-44 rounded-2xl bg-cover bg-center" style={cover} />
      <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-indigo-600 truncate">{venue.name || venue.slug}</h3>
      {venue.address && <p className="text-sm text-gray-500 truncate">{venue.address}</p>}
    </Link>
  )
}
