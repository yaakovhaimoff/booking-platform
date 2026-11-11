// Desktop sidebar: a full-height panel under the navbar (never grows, never scrolls with the page),
// logout pinned to the bottom. The caller supplies the sticky offset / height via className.
// On mobile the same links live in the hamburger menu.
export default function SideNav({ items, active, onSelect, onLogout, logoutLabel, label, className = '' }) {
  return (
    <nav
      aria-label={label}
      className={`hidden md:flex flex-col w-56 shrink-0 self-start overflow-hidden bg-white border-x border-gray-200 p-3 ${className}`}
    >
      <div className="flex flex-col gap-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              active === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.label}
            {item.badge > 0 && (
              <span className="ml-2 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold" aria-label={`${item.badge} new`}>{item.badge}</span>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={onLogout}
        className="mt-auto px-4 py-2.5 rounded-lg text-sm font-medium text-left text-gray-600 border-t border-gray-100 rounded-t-none hover:bg-gray-50 hover:text-gray-900 transition"
      >
        {logoutLabel}
      </button>
    </nav>
  )
}
