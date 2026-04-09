import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { AdminSidebar, getVisibleAdminSidebarItems } from '@/shared/navigation/AdminSidebar'
import { MobileShellNavDrawer } from '@/shared/navigation/MobileShellNavDrawer'

export const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const visibleAdminSidebarItems = getVisibleAdminSidebarItems(user)

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-surface-container-low">
      <AdminSidebar />
      <MobileShellNavDrawer
        open={isMobileNavOpen}
        title="Admin navigation"
        subtitle="Switch between tours, schedules, pricing, and operational queues from one mobile menu."
        items={visibleAdminSidebarItems}
        tone="admin"
        onClose={() => setIsMobileNavOpen(false)}
        onSignOut={logout}
      />
      <div className="lg:ml-64">
        <header className="sticky top-0 z-40 border-b border-outline-variant/10 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open admin navigation"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/30 text-primary lg:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="text-lg font-extrabold text-primary">Admin Shell</div>
              <div className="hidden text-sm text-on-surface-variant sm:block">Operations and queue overview</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right md:block">
                <div className="font-semibold text-primary">{user?.name}</div>
                <div className="text-sm text-on-surface-variant">{user?.title}</div>
              </div>
              <button
                className="rounded-full border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-primary"
                onClick={logout}
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-6 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
