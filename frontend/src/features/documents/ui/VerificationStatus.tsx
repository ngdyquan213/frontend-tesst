import type { DocumentStatus } from '@/shared/types/common'
import { Badge } from '@/shared/ui/Badge'

const variantByStatus = {
  verified: 'success',
  pending: 'warning',
  rejected: 'danger',
} as const

export const VerificationStatus = ({ status }: { status: DocumentStatus }) => (
  <Badge variant={variantByStatus[status]}>{status}</Badge>
)
