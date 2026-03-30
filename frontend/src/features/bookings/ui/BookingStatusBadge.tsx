import type { BookingStatus } from '@/shared/types/common'
import { Badge } from '@/shared/ui/Badge'

const toneByStatus = {
  confirmed: 'success',
  pending: 'warning',
  processing: 'info',
  cancelled: 'danger',
} as const

export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => <Badge tone={toneByStatus[status]}>{status}</Badge>

