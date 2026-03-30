import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'primary-gradient text-white hover:opacity-95',
  secondary: 'bg-secondary text-white hover:brightness-110',
  outline: 'border border-outline-variant bg-white text-primary hover:bg-surface-container-low',
  ghost: 'bg-transparent text-primary hover:bg-surface-container-low',
  danger: 'bg-danger text-white hover:brightness-95',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = ({
  className,
  variant = 'primary',
  children,
  ...props
}: PropsWithChildren<ButtonProps>) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60',
      variantClasses[variant],
      className,
    )}
    {...props}
  >
    {children}
  </button>
)

