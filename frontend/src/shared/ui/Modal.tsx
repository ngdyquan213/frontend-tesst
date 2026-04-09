import type { MouseEvent, PropsWithChildren } from 'react'
import { Button } from '@/shared/ui/Button'
import { useOverlayDialog } from '@/shared/hooks/useOverlayDialog'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
}

export const Modal = ({ open, title, onClose, children }: PropsWithChildren<ModalProps>) => {
  const { panelRef, titleId } = useOverlayDialog({ open, onClose })

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 p-6"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="surface-card w-full max-w-xl p-6"
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
