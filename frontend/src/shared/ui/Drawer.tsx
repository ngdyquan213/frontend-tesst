import type { PropsWithChildren } from 'react'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  side?: 'left' | 'right'
}

export const Drawer = ({
  open,
  title,
  onClose,
  children,
  side = 'right',
}: PropsWithChildren<DrawerProps>) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex bg-primary/20">
      <div
        className={cn(
          'surface-card h-full w-full max-w-lg overflow-y-auto p-6',
          side === 'right' ? 'ml-auto' : 'mr-auto',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
