import { Link, NavLink } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { Button } from '@/shared/ui/Button'
import { useAuth } from '@/app/providers/AuthProvider'

const navItems = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.tours, label: 'Tours' },
  { to: ROUTES.destinations, label: 'Destinations' },
  { to: ROUTES.promotions, label: 'Promotions' },
  { to: ROUTES.help, label: 'Help' },
]

export const MainHeader = () => {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="page-shell flex h-20 items-center justify-between">
        <Link className="text-2xl font-extrabold tracking-tight text-primary" to={ROUTES.home}>
          TravelBook
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive
                  ? 'border-b-2 border-primary pb-1 text-sm font-bold text-primary'
                  : 'text-sm font-semibold text-on-surface-variant transition hover:text-primary'
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                className="rounded-full border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-primary"
                to={user.role === 'admin' ? '/admin' : '/account'}
              >
                {user.role === 'admin' ? 'Admin' : 'My Account'}
              </Link>
              <Button onClick={logout} variant="ghost">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link className="text-sm font-semibold text-primary" to={ROUTES.login}>
                Log In
              </Link>
              <Link className="rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110" to={ROUTES.register}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
