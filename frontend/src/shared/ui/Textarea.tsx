import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      'min-h-28 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-primary outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10',
      className,
    )}
    {...props}
  />
)

