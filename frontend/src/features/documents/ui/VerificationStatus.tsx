import type { DocumentStatus } from '@/shared/types/common'
import { Badge } from '@/shared/ui/Badge'

const toneByStatus = {
  verified: 'success',
  pending: 'warning',
  rejected: 'danger',
} as const

export const VerificationStatus = ({ status }: { status: DocumentStatus }) => <Badge tone={toneByStatus[status]}>{status}</Badge>

