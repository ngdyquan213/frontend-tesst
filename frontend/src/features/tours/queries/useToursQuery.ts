import { useQuery } from '@tanstack/react-query'
import { toursApi } from '@/features/tours/api/tours.api'
import { tourKeys } from '@/features/tours/queries/tourKeys'

export const useToursQuery = (search = '') =>
  useQuery({
    queryKey: tourKeys.list(search),
    queryFn: () => toursApi.getTours(search),
  })

