// import type { Destination as SharedDestination } from '@/shared/types/common'

// export type DestinationRegion =
//   | 'europe'
//   | 'asia'
//   | 'americas'
//   | 'middle-east-africa'
//   | 'oceania'

// export const destinationRegionLabels: Record<DestinationRegion, string> = {
//   europe: 'Europe',
//   asia: 'Asia',
//   americas: 'Americas',
//   'middle-east-africa': 'Middle East & Africa',
//   oceania: 'Oceania',
// }

// export interface Destination
//   extends Pick<
//     SharedDestination,
//     | 'id'
//     | 'slug'
//     | 'name'
//     | 'country'
//     | 'headline'
//     | 'summary'
//     | 'bestFor'
//     | 'featuredTourIds'
//   > {
//   imageUrl: string
//   imageAlt: string
//   region: DestinationRegion
//   featured: boolean
//   tourCount: number
//   tourSearchValue: string
// }

// export interface GetDestinationsOptions {
//   featuredOnly?: boolean
//   limit?: number
// }

export type DestinationRegion = 'mediterranean' | 'northern-europe' | 'asia-pacific'
export type DestinationRegionFilter = 'all' | DestinationRegion

export interface Destination {
  id: string
  slug: string
  name: string
  country: string
  region: DestinationRegion
  eyebrow: string
  summary: string
  description: string
  imageUrl: string
  imageAlt: string
  bestTimeLabel: string
  signatureLabel: string
  featured: boolean
  tourSearchValue: string
  tourCount: number
  startingPrice: number | null
  currency: string
}

export interface DestinationQueryParams {
  query?: string
  region?: DestinationRegion
  featuredOnly?: boolean
  limit?: number
}

export const destinationRegionOptions = [
  'all',
  'mediterranean',
  'northern-europe',
  'asia-pacific',
] as const satisfies readonly DestinationRegionFilter[]

export const destinationRegionLabels: Record<DestinationRegionFilter, string> = {
  all: 'All regions',
  mediterranean: 'Mediterranean',
  'northern-europe': 'Northern Europe',
  'asia-pacific': 'Asia Pacific',
}
