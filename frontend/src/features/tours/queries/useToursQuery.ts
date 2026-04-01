// import { useQuery } from '@tanstack/react-query'
// import { toursApi } from '@/features/tours/api/tours.api'
// import { tourKeys } from '@/features/tours/queries/tourKeys'

// export const useToursQuery = (search = '') =>
//   useQuery({
//     queryKey: tourKeys.list(search),
//     queryFn: () => toursApi.getTours(search),
//   })

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getFeaturedTours, searchTours } from '@/features/tours/api/tours.api'
import { normalizeTourSearchParams } from '@/features/tours/model/tour.schema'
import type { Tour, TourSearchParams } from '@/features/tours/model/tour.types'
import { tourKeys } from '@/features/tours/queries/tourKeys'

export function useToursQuery() {
  return useQuery<Tour[], Error>({
    queryKey: tourKeys.featured(),
    queryFn: ({ signal }) => getFeaturedTours(signal),
  })
}

export function useTourCatalogQuery(params: TourSearchParams = {}) {
  const normalizedParams = normalizeTourSearchParams(params)

  return useQuery<Tour[], Error>({
    queryKey: tourKeys.list(normalizedParams),
    queryFn: ({ signal }) => searchTours(normalizedParams, signal),
    placeholderData: keepPreviousData,
  })
}
