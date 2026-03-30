import { useQuery } from '@tanstack/react-query'
import { toursApi } from '@/features/tours/api/tours.api'
import { tourKeys } from '@/features/tours/queries/tourKeys'

export const useTourDetailQuery = (slug: string) =>
  useQuery({
    queryKey: tourKeys.detail(slug),
    queryFn: () => toursApi.getTourDetail(slug),
  })

