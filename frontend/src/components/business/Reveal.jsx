import { useInView } from '../../utils/useInView'

// Fades its children up (or in from the side) the first time they scroll into view.
export default function Reveal({ as: Tag = 'div', variant = 'reveal', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView()
  return (
    <Tag ref={ref} data-in={inView ? '' : undefined} style={{ '--delay': `${delay}ms` }} className={`bz-${variant} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
