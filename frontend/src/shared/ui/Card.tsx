import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export const Card = ({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn('surface-card p-6', className)} {...props}>
    {children}
  </div>
)

