import { Link } from 'react-router-dom'

interface BreadcrumbsProps {
  items: Array<{ label: string; to?: string }>
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
    {items.map((item, index) => (
      <div key={`${item.label}-${index}`} className="flex items-center gap-2">
        {item.to ? <Link to={item.to}>{item.label}</Link> : <span className="font-medium text-primary">{item.label}</span>}
        {index < items.length - 1 ? <span className="material-symbols-outlined text-xs">chevron_right</span> : null}
      </div>
    ))}
  </nav>
)

