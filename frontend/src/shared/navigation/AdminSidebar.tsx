import { NavLink } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { ADMIN_NAV_ROUTE_PERMISSIONS } from '@/shared/constants/permissions'
import { hasAnyPermission } from '@/shared/lib/auth'
import type { AppUser } from '@/shared/types/common'

export interface AdminSidebarItem {
  to: string
  label: string
  icon: string
  requiredPermissions: readonly string[]
}

export const adminSidebarItems: AdminSidebarItem[] = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.dashboard },
  { to: '/admin/tours', label: 'Tours', icon: 'explore', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.tours },
  { to: '/admin/schedules', label: 'Schedules', icon: 'calendar_today', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.schedules },
  { to: '/admin/pricing', label: 'Pricing', icon: 'payments', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.pricing },
  { to: '/admin/bookings', label: 'Bookings', icon: 'confirmation_number', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.bookings },
  { to: '/admin/refunds', label: 'Refunds', icon: 'assignment_return', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.refunds },
  { to: '/admin/documents', label: 'Documents', icon: 'description', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.documents },
  { to: '/admin/operations', label: 'Operations', icon: 'settings_applications', requiredPermissions: ADMIN_NAV_ROUTE_PERMISSIONS.operations },
]

export function getVisibleAdminSidebarItems(user?: AppUser | null) {
  return adminSidebarItems.filter((item) => hasAnyPermission(user, item.requiredPermissions))
}

export const AdminSidebar = () => {
  const { user } = useAuth()
  const visibleItems = getVisibleAdminSidebarItems(user)

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-outline-variant/10 bg-slate-50 px-4 py-6 lg:flex">
      <div className="mb-8 px-4 text-2xl font-extrabold tracking-tight text-primary">TravelBook</div>
      <nav className="space-y-1">
        {visibleItems.map((item) => (
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
}
