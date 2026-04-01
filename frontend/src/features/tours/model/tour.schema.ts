// import { z } from 'zod'

// export const tourSearchSchema = z.object({
//   search: z.string().optional(),
// })

import type { TourSearchParams } from '@/features/tours/model/tour.types'

export const tourSchema = {
  destinationMaxLength: 80,
  maxListLimit: 24,
} as const

export function normalizeTourSearchParams(params: TourSearchParams = {}): TourSearchParams {
  const destination = params.destination?.trim()
  const normalizedParams: TourSearchParams = {}

  if (destination) {
    normalizedParams.destination = destination.slice(0, tourSchema.destinationMaxLength)
  }

  if (params.duration) {
    normalizedParams.duration = params.duration
  }

  if (params.groupSize) {
    normalizedParams.groupSize = params.groupSize
  }

  if (params.priceRange) {
    normalizedParams.priceRange = params.priceRange
  }

  if (typeof params.limit === 'number' && Number.isFinite(params.limit)) {
    normalizedParams.limit = Math.max(1, Math.min(Math.floor(params.limit), tourSchema.maxListLimit))
  }

  return normalizedParams
}
