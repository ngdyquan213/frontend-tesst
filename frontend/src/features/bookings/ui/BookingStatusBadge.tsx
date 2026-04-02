import type { BookingStatus } from '@/shared/types/common'
import { Badge } from '@/shared/ui/Badge'

const variantByStatus = {
  confirmed: 'success',
  pending: 'warning',
  processing: 'info',
  cancelled: 'danger',
} as const

export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => (
  <Badge variant={variantByStatus[status]}>{status}</Badge>
)
