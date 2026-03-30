import type { PaymentStatus } from '@/shared/types/common'
import { Alert } from '@/shared/ui/Alert'

export const PaymentStatusPanel = ({ status }: { status: PaymentStatus }) => (
  <Alert tone={status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'info'}>
    Payment status: {status}
  </Alert>
)

