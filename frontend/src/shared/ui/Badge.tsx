import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'
type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'teal' | 'inverse' | 'info'

interface BadgeProps {
  label?: string
  children?: ReactNode
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  gray: 'bg-[color:var(--color-surface-low)] text-[color:var(--color-on-surface-variant)]',
  teal: 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]',
  inverse: 'bg-white/10 text-white',
  info: 'bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]',
}

const sizeStyles = {
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
  lg: 'px-4 py-2 text-sm',
}

const toneToVariant: Record<BadgeTone, BadgeVariant> = {
  neutral: 'gray',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
}

export function Badge({ label, children, tone, variant = 'gray', size = 'md', className }: BadgeProps) {
  const resolvedVariant = tone ? toneToVariant[tone] : variant

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold uppercase tracking-[0.18em]',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
    >
      {label ?? children}
    </span>
  )
}
