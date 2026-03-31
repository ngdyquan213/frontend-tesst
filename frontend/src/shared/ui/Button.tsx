import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'hero'
  | 'soft'

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[color:var(--color-primary)] text-white shadow-[0_14px_32px_rgba(0,17,58,0.18)] hover:-translate-y-0.5 hover:bg-[color:var(--color-primary-strong)]',
  secondary:
    'border-[color:var(--color-outline-variant)] bg-white text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-low)]',
  danger:
    'border-transparent bg-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700',
  ghost:
    'border-transparent bg-transparent text-[color:var(--color-on-surface-variant)] hover:bg-[color:var(--color-surface-low)] hover:text-[color:var(--color-primary)]',
  outline:
    'border-[color:var(--color-outline)] bg-transparent text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-low)]',
  hero:
    'primary-gradient border-transparent text-white shadow-[0_18px_42px_rgba(0,17,58,0.24)] hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(0,17,58,0.28)]',
  soft:
    'border-transparent bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)] hover:bg-[color:var(--color-secondary-soft)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  disabled = false,
  type,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-secondary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  )
}
