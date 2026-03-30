import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      'w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-primary outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10',
      className,
    )}
    {...props}
  >
    {children}
  </select>
)

