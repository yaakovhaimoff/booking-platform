import { useScrolled } from '../../utils/useScrolled'

// Sticky, floating site header. Wide and transparent at the top of the page; after scrolling the bar
// shrinks into a white pill with a soft shadow (see .bz-nav-bar in index.css).
// No backdrop blur here: it would trap the fixed mobile menu overlay inside the header.
export default function FloatingHeader({ barClassName = '', children }) {
  const headerRef = useScrolled()
  return (
    <header ref={headerRef} className="sticky top-0 z-40 h-[78px] px-3 pt-3.5 sm:px-6">
      <div className={`bz-nav-bar mx-auto h-16 w-full rounded-full ps-5 pe-2.5 ${barClassName}`}>{children}</div>
    </header>
  )
}
