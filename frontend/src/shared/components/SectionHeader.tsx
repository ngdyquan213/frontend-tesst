import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface SectionHeaderProps {
  readonly eyebrow?: string
  readonly title: string
  readonly subtitle?: string
  readonly action?: ReactNode
  readonly align?: 'left' | 'center'
  readonly inverse?: boolean
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  align = 'left',
  inverse = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:flex-col md:items-center'
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p
            className={cn(
              'text-xs font-bold uppercase tracking-[0.24em]',
              inverse ? 'text-white/70' : 'text-(--color-secondary-strong)'
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            'mt-2 font-(family-name:--font-display) text-3xl font-extrabold tracking-tight md:text-4xl',
            inverse ? 'text-white' : 'text-primary'
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              'mt-3 text-base leading-7',
              inverse ? 'text-(--color-primary-soft)' : 'text-on-surface-variant'
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
