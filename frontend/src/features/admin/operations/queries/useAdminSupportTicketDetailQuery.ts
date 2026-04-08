import { useQuery } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { adminSupportKeys } from '@/features/admin/operations/queries/adminSupportKeys'

export const useAdminSupportTicketDetailQuery = (id: string) =>
  useQuery({
    queryKey: adminSupportKeys.detail(id),
    queryFn: () => supportApi.getAdminSupportTicketDetail(id),
    enabled: Boolean(id),
  })
