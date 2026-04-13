import type { Destination } from '@/features/destinations/model/destination.types'
import type { Tour as ApiTour } from '@/shared/types/api'

function normalizeKeyword(value?: string) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function findMatchingDestinationContent(
  apiTour: ApiTour,
  destinations: Destination[],
): Destination | null {
  const tourDestination = normalizeKeyword(apiTour.destination)
  const tourName = normalizeKeyword(apiTour.name)
  const tourKeyword = normalizeKeyword(`${apiTour.destination} ${apiTour.name}`)

  return (
    destinations.find((destination) => {
      const destinationName = normalizeKeyword(destination.name)
      const destinationSearchValue = normalizeKeyword(destination.tourSearchValue)
      const destinationKeyword = normalizeKeyword(
        `${destination.name} ${destination.country} ${destination.slug} ${destination.tourSearchValue}`,
      )

      return (
        destinationName === tourDestination ||
        destinationSearchValue === tourDestination ||
        destinationKeyword.includes(tourDestination) ||
        tourKeyword.includes(destinationName) ||
        tourKeyword.includes(destinationSearchValue) ||
        destinationKeyword.includes(tourName)
      )
    }) ?? null
  )
}
