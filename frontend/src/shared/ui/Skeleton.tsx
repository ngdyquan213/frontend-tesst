import { cn } from '@/shared/lib/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(226,232,240,0.78),rgba(241,245,249,1),rgba(226,232,240,0.78))] bg-[length:200%_100%]',
        className
      )}
    />
  )
}
