import { NavLink } from 'react-router-dom'

const items = [
  { to: '/account', label: 'Dashboard', icon: 'dashboard' },
  { to: '/account/profile', label: 'Profile', icon: 'person' },
  { to: '/account/change-password', label: 'Password', icon: 'lock' },
  { to: '/account/travelers', label: 'Travelers', icon: 'group' },
  { to: '/account/bookings', label: 'Bookings', icon: 'event_available' },
  { to: '/account/vouchers', label: 'Vouchers', icon: 'local_activity' },
  { to: '/account/documents', label: 'Documents', icon: 'description' },
  { to: '/account/refunds', label: 'Refunds', icon: 'payments' },
  { to: '/account/notifications', label: 'Notifications', icon: 'notifications' },
  { to: '/account/support', label: 'Support', icon: 'support_agent' },
]

export const UserSidebar = () => (
  <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-outline-variant/10 bg-slate-50 px-4 py-8 lg:flex">
    <div className="mb-10 px-4 text-2xl font-bold tracking-tight text-primary">TravelBook</div>
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            isActive
              ? 'flex items-center gap-3 rounded-xl border-r-4 border-primary bg-slate-200/60 px-4 py-3 text-sm font-bold text-primary'
              : 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-on-surface-variant transition hover:bg-slate-200/50 hover:text-primary'
          }
          end={item.to === '/account'}
          to={item.to}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
)

