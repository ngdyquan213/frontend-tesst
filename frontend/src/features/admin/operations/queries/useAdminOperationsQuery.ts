import { useQuery } from '@tanstack/react-query'
import { adminOperationsApi } from '@/features/admin/operations/api/adminOperations.api'
import { adminOperationKeys } from '@/features/admin/operations/queries/adminOperationKeys'

export const useAdminOperationsQuery = () =>
  useQuery({
    queryKey: adminOperationKeys.list(),
    queryFn: adminOperationsApi.getOperations,
  })

