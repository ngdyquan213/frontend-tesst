import type { MouseEvent, PropsWithChildren } from 'react'
import { Button } from '@/shared/ui/Button'
import { useOverlayDialog } from '@/shared/hooks/useOverlayDialog'
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
  const { panelRef, titleId } = useOverlayDialog({ open, onClose })

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex bg-primary/20" onMouseDown={handleBackdropMouseDown}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'surface-card h-full w-full max-w-lg overflow-y-auto p-6',
          side === 'right' ? 'ml-auto' : 'mr-auto',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-bold text-primary">
            {title}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
