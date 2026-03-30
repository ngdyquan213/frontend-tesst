import type { PropsWithChildren } from 'react'
import { Button } from '@/shared/ui/Button'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
}

export const Modal = ({ open, title, onClose, children }: PropsWithChildren<ModalProps>) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 p-6">
      <div className="surface-card w-full max-w-xl p-6">
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

