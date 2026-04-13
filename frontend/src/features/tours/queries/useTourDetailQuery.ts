import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/apiClient'
import { getTourDetailById } from '@/features/tours/api/tours.api'
import { findMatchingDestinationContent } from '@/features/tours/lib/matchDestinationContent'
import {
  buildTourDetail,
  formatDateLabel,
  formatStatusLabel,
  formatTravelerType,
  type TourDetail,
  type TourPriceRule,
  type TourSchedule,
} from '@/features/tours/lib/tourDetailMapper'

async function fetchTourDetail(id: string, signal?: AbortSignal) {
  const rawTour = await getTourDetailById(id, signal)
  if (!rawTour) {
    throw new Error('Tour not found.')
  }

  const destinations = await apiClient.getDestinations().catch(() => [])

  return buildTourDetail(rawTour, findMatchingDestinationContent(rawTour, destinations))
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
