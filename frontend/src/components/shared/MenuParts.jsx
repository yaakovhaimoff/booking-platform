import { Link } from 'react-router-dom'
import { ArrowRightIcon, ChevronRightIcon } from './icons'

// A titled group of menu rows. On mobile it renders as a white card.
export function MenuGroup({ title, children }) {
  return (
    <div className="max-[480px]:rounded-2xl max-[480px]:bg-white max-[480px]:border max-[480px]:border-gray-100 max-[480px]:p-4">
      {title && <h2 className="text-xl font-bold text-gray-900 mb-2 max-[480px]:text-lg max-[480px]:mb-1">{title}</h2>}
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

export function MenuItem({ to, onClick, icon, active, children, href }) {
  const cls = `flex items-center justify-between gap-3 py-2.5 text-sm ${active ? 'text-indigo-600 font-medium' : 'text-gray-800 hover:text-indigo-600'} max-[480px]:text-base max-[480px]:py-3`
  const inner = (
    <>
      <span className="flex items-center gap-3">{icon}{children}</span>
      <ChevronRightIcon size={18} className="hidden max-[480px]:block text-gray-900" />
    </>
  )
  return (
    <li>
      {href
        ? <a href={href} onClick={onClick} className={cls}>{inner}</a>
        : to
          ? <Link to={to} onClick={onClick} className={cls}>{inner}</Link>
          : <button type="button" onClick={onClick} className={`${cls} w-full text-left`}>{inner}</button>}
    </li>
  )
}

// The separate "other world" row at the bottom of a menu.
export function MenuSwitchRow({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-semibold text-gray-900 hover:text-indigo-600
        max-[480px]:mt-0 max-[480px]:pt-0 max-[480px]:border-0 max-[480px]:rounded-2xl max-[480px]:bg-white max-[480px]:border-gray-100 max-[480px]:p-4 max-[480px]:pt-4 max-[480px]:pb-4 max-[480px]:text-base"
    >
      {children}
      <ArrowRightIcon size={18} />
    </Link>
  )
}
