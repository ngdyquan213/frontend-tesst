import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'
import { adminTourKeys } from '@/features/admin/tours/queries/adminTourKeys'

export const useAdminToursQuery = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: adminTourKeys.list({ page, pageSize }),
    queryFn: () => adminToursApi.getTours(page, pageSize),
    placeholderData: keepPreviousData,
  })
