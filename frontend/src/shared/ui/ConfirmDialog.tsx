import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onClose: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <Modal open={open} onClose={onClose} title={title}>
    <p className="mb-6 text-sm text-on-surface-variant">{description}</p>
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </div>
  </Modal>
)

