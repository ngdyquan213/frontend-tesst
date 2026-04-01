// import type {
//   Destination,
//   Tour as SharedTour,
//   TourSchedule as SharedTourSchedule,
// } from '@/shared/types/common'

// export type Tour = SharedTour
// export type TourItem = SharedTour
// export type TourDestination = Destination
// export type TourSchedule = SharedTourSchedule
// export type TourScheduleItem = SharedTourSchedule

export type TourAvailability = 'available' | 'limited' | 'sold_out'
export type TourDurationFilter = 'all' | 'short' | 'medium' | 'long'
export type TourGroupSizeFilter = 'all' | 'intimate' | 'shared' | 'large'
export type TourPriceRangeFilter = 'all' | 'under-1500' | '1500-2500' | '2500-plus'

export interface DestinationHighlight {
  title: string
  description: string
  imageUrl: string
  imageAlt: string
}

export interface Tour {
  id: string
  slug: string
  destination: string
  name: string
  summary: string
  durationDays: number
  maxGroupSize: number
  price: number
  currency: string
  imageUrl: string
  imageAlt: string
  availability: TourAvailability
  featuredLabel?: string
}

export interface TourSearchFilterValues {
  destination: string
  duration: TourDurationFilter
  groupSize: TourGroupSizeFilter
  priceRange: TourPriceRangeFilter
}

export interface TourSearchParams {
  destination?: string
  duration?: Exclude<TourDurationFilter, 'all'>
  groupSize?: Exclude<TourGroupSizeFilter, 'all'>
  priceRange?: Exclude<TourPriceRangeFilter, 'all'>
  limit?: number
}

export const TOUR_DURATION_FILTERS = ['all', 'short', 'medium', 'long'] as const
export const TOUR_GROUP_SIZE_FILTERS = ['all', 'intimate', 'shared', 'large'] as const
export const TOUR_PRICE_RANGE_FILTERS = ['all', 'under-1500', '1500-2500', '2500-plus'] as const

export const DEFAULT_TOUR_SEARCH_FILTERS: TourSearchFilterValues = {
  destination: '',
  duration: 'all',
  groupSize: 'all',
  priceRange: 'all',
}

export type TourModel = Tour
