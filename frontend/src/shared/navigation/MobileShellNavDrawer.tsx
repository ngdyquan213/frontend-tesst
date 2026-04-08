import { NavLink } from 'react-router-dom'
import { Drawer } from '@/shared/ui/Drawer'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

export interface MobileShellNavItem {
  to: string
  label: string
  icon: string
}

interface MobileShellNavDrawerProps {
  open: boolean
  title: string
  subtitle?: string
  items: MobileShellNavItem[]
  tone: 'account' | 'admin'
  onClose: () => void
  onSignOut: () => void
}

export function MobileShellNavDrawer({
  open,
  title,
  subtitle,
  items,
  tone,
  onClose,
  onSignOut,
}: MobileShellNavDrawerProps) {
  return (
    <Drawer open={open} title={title} onClose={onClose} side="left">
      <div className="space-y-6">
        {subtitle ? <p className="text-sm leading-6 text-on-surface-variant">{subtitle}</p> : null}

        <nav aria-label={`${title} navigation`} className="space-y-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              end={item.to === '/account' || item.to === '/admin'}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                  tone === 'account'
                    ? isActive
                      ? 'bg-primary text-white shadow-[0_14px_28px_rgba(0,17,58,0.16)]'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    : isActive
                      ? 'bg-secondary text-white shadow-[0_14px_28px_rgba(0,106,106,0.18)]'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-primary',
                )
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <Button type="button" variant="outline" className="w-full" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </Drawer>
  )
}
