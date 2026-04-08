import { useQuery } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { adminSupportKeys } from '@/features/admin/operations/queries/adminSupportKeys'

export const useAdminSupportTicketsQuery = (status?: string) =>
  useQuery({
    queryKey: adminSupportKeys.list(status ?? 'all'),
    queryFn: () => supportApi.getAdminSupportTickets(status),
  })
