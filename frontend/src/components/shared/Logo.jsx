import { Link } from 'react-router-dom'

// torni mark: a "t" whose foot curves back to the right ("torni" = you come back).
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="torni-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#torni-g)" />
      <g fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 13v26a10 10 0 0 0 10 10h6" />
        <path d="M17.500 25.500h24" />
      </g>
    </svg>
  )
}

export default function Logo({ to = '/', suffix, onClick }) {
  return (
    <Link to={to} onClick={onClick} aria-label={`torni${suffix ? ` ${suffix}` : ''}`} className="flex items-center gap-2 shrink-0">
      <LogoMark />
      <span className="font-display text-2xl font-extrabold tracking-tight text-gray-950 leading-none">torni</span>
      {suffix && <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 leading-none mt-1">{suffix}</span>}
    </Link>
  )
}
