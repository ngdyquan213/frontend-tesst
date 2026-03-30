import { Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { UserSidebar } from '@/shared/navigation/UserSidebar'

export const AccountLayout = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-surface">
      <UserSidebar />
      <div className="lg:ml-64">
        <header className="sticky top-0 z-40 border-b border-outline-variant/10 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
            <div>
              <div className="text-lg font-bold text-primary">Account Dashboard</div>
              <div className="text-sm text-on-surface-variant">{user?.memberId}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right md:block">
                <div className="font-semibold text-primary">{user?.name}</div>
                <div className="text-sm text-on-surface-variant">{user?.title}</div>
              </div>
              <button className="rounded-full border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-primary" onClick={logout} type="button">
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

