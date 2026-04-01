import {
  destinationRegionOptions,
  type DestinationQueryParams,
  type DestinationRegion,
  type DestinationRegionFilter,
} from '@/features/destinations/model/destination.types'

export const destinationSchema = {
  queryMaxLength: 80,
  maxListLimit: 12,
} as const

const destinationRegionSet = new Set<DestinationRegion>(
  destinationRegionOptions.filter((option): option is DestinationRegion => option !== 'all')
)

export function isDestinationRegion(value: string): value is DestinationRegion {
  return destinationRegionSet.has(value as DestinationRegion)
}

export function isDestinationRegionFilter(value: string): value is DestinationRegionFilter {
  return destinationRegionOptions.includes(value as DestinationRegionFilter)
}

export function normalizeDestinationQuery(value?: string) {
  return value?.trim().slice(0, destinationSchema.queryMaxLength) ?? ''
}

export function normalizeDestinationQueryParams(
  params: DestinationQueryParams = {}
): DestinationQueryParams {
  const normalizedQuery = normalizeDestinationQuery(params.query)
  const normalizedParams: DestinationQueryParams = {}

  if (normalizedQuery) {
    normalizedParams.query = normalizedQuery
  }

  if (params.region && isDestinationRegion(params.region)) {
    normalizedParams.region = params.region
  }

  if (params.featuredOnly) {
    normalizedParams.featuredOnly = true
  }

  if (typeof params.limit === 'number' && Number.isFinite(params.limit)) {
    normalizedParams.limit = Math.max(
      1,
      Math.min(Math.floor(params.limit), destinationSchema.maxListLimit)
    )
  }

  return normalizedParams
}
