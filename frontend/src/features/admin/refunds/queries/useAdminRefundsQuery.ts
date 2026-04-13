import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminRefundsApi } from '@/features/admin/refunds/api/adminRefunds.api'
import { adminRefundKeys } from '@/features/admin/refunds/queries/adminRefundKeys'

export const useAdminRefundsQuery = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: adminRefundKeys.list({ page, pageSize }),
    queryFn: () => adminRefundsApi.getRefunds(page, pageSize),
    placeholderData: keepPreviousData,
  })
