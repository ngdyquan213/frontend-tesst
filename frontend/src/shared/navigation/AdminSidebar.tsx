import { NavLink } from 'react-router-dom'

export const adminSidebarItems = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/tours', label: 'Tours', icon: 'explore' },
  { to: '/admin/schedules', label: 'Schedules', icon: 'calendar_today' },
  { to: '/admin/pricing', label: 'Pricing', icon: 'payments' },
  { to: '/admin/bookings', label: 'Bookings', icon: 'confirmation_number' },
  { to: '/admin/refunds', label: 'Refunds', icon: 'assignment_return' },
  { to: '/admin/documents', label: 'Documents', icon: 'description' },
  { to: '/admin/operations', label: 'Operations', icon: 'settings_applications' },
]

export const AdminSidebar = () => (
  <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-outline-variant/10 bg-slate-50 px-4 py-6 lg:flex">
    <div className="mb-8 px-4 text-2xl font-extrabold tracking-tight text-primary">TravelBook</div>
    <nav className="space-y-1">
      {adminSidebarItems.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            isActive
              ? 'mx-2 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white'
              : 'mx-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-on-surface-variant transition hover:bg-slate-200/60 hover:text-primary'
          }
          end={item.to === '/admin'}
          to={item.to}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
)
