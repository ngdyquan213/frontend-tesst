import { useQuery } from '@tanstack/react-query'
import { getTourDetailById as getMockTourDetailById } from '@/features/tours/api/tours.api'
import {
  buildTourDetail,
  formatDateLabel,
  formatStatusLabel,
  formatTravelerType,
  type TourDetail,
  type TourPriceRule,
  type TourSchedule,
} from '@/features/tours/lib/tourDetailMapper'
import { apiClient } from '@/shared/api/apiClient'
import { isMockApiEnabled } from '@/shared/api/mockMode'

async function fetchTourDetail(id: string, signal?: AbortSignal) {
  if (isMockApiEnabled()) {
    const mockTour = await getMockTourDetailById(id, signal)

    if (mockTour) {
      return buildTourDetail(mockTour)
    }
  }

  const rawTour = await apiClient.getTourById(id)
  return buildTourDetail(rawTour)
}

export function createTourDetailQueryOptions(id?: string) {
  return {
    queryKey: ['tours', 'detail', id ?? 'missing'] as const,
    enabled: Boolean(id),
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      if (!id) {
        throw new Error('Missing tour id.')
      }

      return fetchTourDetail(id, signal)
    },
  }
}

export function useTourDetailQuery(id?: string) {
  return useQuery<TourDetail, Error>(createTourDetailQueryOptions(id))
}

export { buildTourDetail, formatDateLabel, formatStatusLabel, formatTravelerType }
export type { TourDetail, TourPriceRule, TourSchedule }
