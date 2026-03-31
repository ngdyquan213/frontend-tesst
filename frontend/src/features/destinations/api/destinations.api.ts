import { resolveAfter } from '@/shared/api/apiClient'
import { destinations, tours } from '@/shared/api/mockData'
import type {
  Destination,
  DestinationRegion,
  GetDestinationsOptions,
} from '@/features/destinations/model/destination.types'

const regionByCountry: Partial<Record<string, DestinationRegion>> = {
  Italy: 'europe',
  Switzerland: 'europe',
  Japan: 'asia',
}

function getDestinationRegion(country: string): DestinationRegion {
  return regionByCountry[country] ?? 'americas'
}

function mapDestination(
  destination: (typeof destinations)[number],
): Destination {
  const tourCount = tours.filter(
    (tour) => tour.destinationId === destination.id,
  ).length

  return {
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    headline: destination.headline,
    summary: destination.summary,
    bestFor: destination.bestFor,
    featuredTourIds: destination.featuredTourIds,
    imageUrl: destination.image,
    imageAlt: `${destination.name}, ${destination.country}`,
    region: getDestinationRegion(destination.country),
    featured: destination.featuredTourIds.length > 0,
    tourCount,
    tourSearchValue: destination.name,
  }
}

export const destinationsApi = {
  async getDestinations(options: GetDestinationsOptions = {}) {
    const { featuredOnly = false, limit } = options

    const mappedDestinations = destinations.map(mapDestination)
    const filteredDestinations = featuredOnly
      ? mappedDestinations.filter((destination) => destination.featured)
      : mappedDestinations
    const limitedDestinations =
      typeof limit === 'number'
        ? filteredDestinations.slice(0, limit)
        : filteredDestinations

    return resolveAfter(limitedDestinations)
  },
}
