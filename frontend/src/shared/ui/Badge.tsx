import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

interface BadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

export const Badge = ({ tone = 'neutral', children }: PropsWithChildren<BadgeProps>) => (
  <span
    className={cn(
      'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
      tone === 'neutral' && 'bg-surface-container text-primary',
      tone === 'success' && 'status-success',
      tone === 'warning' && 'status-warning',
      tone === 'danger' && 'status-danger',
      tone === 'info' && 'status-info',
    )}
  >
    {children}
  </span>
)

