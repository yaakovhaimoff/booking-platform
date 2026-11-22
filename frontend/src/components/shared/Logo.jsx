import { Link } from 'react-router-dom'

export function LogoMark() {
  return <img src="/torni-mark.png" alt="" aria-hidden="true" className="h-[0.8em] w-auto shrink-0 relative top-[0.015em]" />
}

export default function Logo({ to = '/', suffix, onClick }) {
  return (
    <Link to={to} onClick={onClick} aria-label={`torni${suffix ? ` ${suffix}` : ''}`} className="flex items-baseline shrink-0 font-logo text-[36px] font-extrabold tracking-tight text-cta-600 leading-none">
      <LogoMark />
      <span className="ms-0.5">orni</span>
      {suffix && <span className="ms-2 font-sans text-xs font-semibold uppercase tracking-wider text-gray-500">{suffix}</span>}
    </Link>
  )
}
