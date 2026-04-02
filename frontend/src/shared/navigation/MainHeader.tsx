import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <Link className="text-2xl font-extrabold tracking-tight text-primary" to={ROUTES.home}>
          TravelBook
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.to === ROUTES.home}
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
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-3 md:flex">
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
                <Link
                  className="rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  to={ROUTES.register}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {user ? (
            <Link
              className="rounded-full border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-primary md:hidden"
              to={user.role === 'admin' ? '/admin' : '/account'}
            >
              {user.role === 'admin' ? 'Admin' : 'Account'}
            </Link>
          ) : (
            <Link
              className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 md:hidden"
              to={ROUTES.register}
            >
              Start
            </Link>
          )}

          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant/40 bg-white text-primary transition hover:bg-surface-low md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-outline-variant/20 bg-white/95 md:hidden">
          <div className="page-shell flex flex-col gap-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.home}
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-2xl bg-[color:var(--color-primary)] px-4 py-3 text-sm font-bold text-white'
                    : 'rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-low hover:text-primary'
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <Button
                onClick={() => {
                  logout()
                  setIsMobileMenuOpen(false)
                }}
                variant="ghost"
                className="justify-start rounded-2xl px-4 py-3"
              >
                Sign out
              </Button>
            ) : (
              <Link
                className="rounded-2xl border border-outline-variant/30 px-4 py-3 text-sm font-semibold text-primary"
                to={ROUTES.login}
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
