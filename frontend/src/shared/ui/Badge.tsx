import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface BadgeProps {
  label?: string
  children?: ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'teal' | 'inverse'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({ label, children, variant = 'gray', size = 'md', className }: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    gray: 'bg-[color:var(--color-surface-low)] text-[color:var(--color-on-surface-variant)]',
    teal: 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]',
    inverse: 'bg-white/10 text-white',
  }

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold uppercase tracking-[0.18em]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {label ?? children}
    </span>
  )
}
