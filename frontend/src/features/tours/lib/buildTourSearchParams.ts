// export const buildTourSearchParams = (search: string) => ({ search: search.trim().toLowerCase() })

import {
  DEFAULT_TOUR_SEARCH_FILTERS,
  TOUR_DURATION_FILTERS,
  TOUR_GROUP_SIZE_FILTERS,
  TOUR_PRICE_RANGE_FILTERS,
} from '@/features/tours/model/tour.types'
import { normalizeTourSearchParams } from '@/features/tours/model/tour.schema'
import type {
  TourDurationFilter,
  TourGroupSizeFilter,
  TourPriceRangeFilter,
  TourSearchFilterValues,
  TourSearchParams,
} from '@/features/tours/model/tour.types'

const durationFilterSet = new Set<TourDurationFilter>(TOUR_DURATION_FILTERS)
const groupSizeFilterSet = new Set<TourGroupSizeFilter>(TOUR_GROUP_SIZE_FILTERS)
const priceRangeFilterSet = new Set<TourPriceRangeFilter>(TOUR_PRICE_RANGE_FILTERS)

function normalizeDestination(destination: string) {
  return destination.trim()
}

export function buildTourSearchParams(filters: TourSearchFilterValues): TourSearchParams {
  const destination = normalizeDestination(filters.destination)
  const params: TourSearchParams = {}

  if (destination) {
    params.destination = destination
  }

  if (filters.duration !== 'all') {
    params.duration = filters.duration
  }

  if (filters.groupSize !== 'all') {
    params.groupSize = filters.groupSize
  }

  if (filters.priceRange !== 'all') {
    params.priceRange = filters.priceRange
  }

  return normalizeTourSearchParams(params)
}

export function buildTourSearchQueryString(filters: TourSearchFilterValues) {
  const params = normalizeTourSearchParams(buildTourSearchParams(filters))
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  return searchParams
}

export function hasActiveTourSearchParams(params: TourSearchParams) {
  return Object.keys(params).length > 0
}

export function parseTourSearchFilters(searchParams: URLSearchParams): TourSearchFilterValues {
  const duration = searchParams.get('duration')
  const groupSize = searchParams.get('groupSize')
  const priceRange = searchParams.get('priceRange')

  return {
    destination: normalizeDestination(searchParams.get('destination') ?? DEFAULT_TOUR_SEARCH_FILTERS.destination),
    duration:
      duration && durationFilterSet.has(duration as TourDurationFilter)
        ? (duration as TourDurationFilter)
        : DEFAULT_TOUR_SEARCH_FILTERS.duration,
    groupSize:
      groupSize && groupSizeFilterSet.has(groupSize as TourGroupSizeFilter)
        ? (groupSize as TourGroupSizeFilter)
        : DEFAULT_TOUR_SEARCH_FILTERS.groupSize,
    priceRange:
      priceRange && priceRangeFilterSet.has(priceRange as TourPriceRangeFilter)
        ? (priceRange as TourPriceRangeFilter)
        : DEFAULT_TOUR_SEARCH_FILTERS.priceRange,
  }
}
