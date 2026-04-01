// import { createQueryKeys } from '@/shared/api/createQueryKeys'

// export const tourKeys = createQueryKeys('tours')

import { normalizeTourSearchParams } from '@/features/tours/model/tour.schema'
import type { TourSearchParams } from '@/features/tours/model/tour.types'

export const tourKeys = {
  all: ['tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  featured: () => [...tourKeys.lists(), 'featured'] as const,
  catalog: () => [...tourKeys.lists(), 'catalog'] as const,
  list: (params: TourSearchParams = {}) => [...tourKeys.catalog(), normalizeTourSearchParams(params)] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
}
