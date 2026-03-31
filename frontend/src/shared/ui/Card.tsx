import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
  padding?: keyof typeof paddingStyles
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)] shadow-[0_18px_36px_rgba(15,23,42,0.06)] transition-all duration-300',
        paddingStyles[padding],
        hoverable &&
          'cursor-pointer hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  readonly title: string
  readonly subtitle?: string
  readonly action?: ReactNode
  readonly className?: string
}

export function CardHeader(props: Readonly<CardHeaderProps>) {
  const { title, subtitle, action, className } = props

  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-primary">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody(props: Readonly<CardBodyProps>) {
  const { children, className = '' } = props
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}
export function CardFooter(props: Readonly<CardFooterProps>) {
  const { children, className = '' } = props

  return (
    <div
      className={cn(
        'mt-6 flex gap-3 border-t border-outline-variant pt-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
