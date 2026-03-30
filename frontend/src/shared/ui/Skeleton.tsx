import { cn } from '@/shared/lib/cn'

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-xl bg-surface-container', className)} />
)

