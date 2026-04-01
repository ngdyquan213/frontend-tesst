import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'rounded-[28px] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)] shadow-[0_18px_36px_rgba(15,23,42,0.06)] transition-all duration-300',
        paddingStyles[padding],
        hoverable && 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-primary)]">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-[color:var(--color-on-surface-variant)]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 flex gap-3 border-t border-[color:var(--color-outline-variant)] pt-6',
        className
      )}
    >
      {children}
    </div>
  )
}
