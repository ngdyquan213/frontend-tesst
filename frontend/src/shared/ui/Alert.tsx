import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export const Alert = ({
  tone = 'info',
  children,
}: PropsWithChildren<{ tone?: 'info' | 'success' | 'warning' | 'danger' }>) => (
  <div
    className={cn(
      'rounded-3xl border px-5 py-4 text-sm',
      tone === 'info' && 'border-info/15 bg-info-soft text-info',
      tone === 'success' && 'border-success/15 bg-success-soft text-success',
      tone === 'warning' && 'border-warning/15 bg-warning-soft text-warning',
      tone === 'danger' && 'border-danger/15 bg-danger-soft text-danger',
    )}
  >
    {children}
  </div>
)

