import { useQuery } from '@tanstack/react-query'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'
import { adminTourKeys } from '@/features/admin/tours/queries/adminTourKeys'

export const useAdminToursQuery = () =>
  useQuery({
    queryKey: adminTourKeys.list(),
    queryFn: adminToursApi.getTours,
  })

