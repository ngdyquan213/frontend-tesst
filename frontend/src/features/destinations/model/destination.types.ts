import type { Destination as SharedDestination } from '@/shared/types/common'

export type DestinationRegion =
  | 'europe'
  | 'asia'
  | 'americas'
  | 'middle-east-africa'
  | 'oceania'

export const destinationRegionLabels: Record<DestinationRegion, string> = {
  europe: 'Europe',
  asia: 'Asia',
  americas: 'Americas',
  'middle-east-africa': 'Middle East & Africa',
  oceania: 'Oceania',
}

export interface Destination
  extends Pick<
    SharedDestination,
    | 'id'
    | 'slug'
    | 'name'
    | 'country'
    | 'headline'
    | 'summary'
    | 'bestFor'
    | 'featuredTourIds'
  > {
  imageUrl: string
  imageAlt: string
  region: DestinationRegion
  featured: boolean
  tourCount: number
  tourSearchValue: string
}

export interface GetDestinationsOptions {
  featuredOnly?: boolean
  limit?: number
}
