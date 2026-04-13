import type { Destination } from '@/features/destinations/model/destination.types'
import { findMatchingDestinationContent } from '@/features/tours/lib/matchDestinationContent'
import { normalizeTourSearchParams } from '@/features/tours/model/tour.schema'
import type { Tour, TourSearchParams } from '@/features/tours/model/tour.types'
import { apiClient } from '@/shared/api/apiClient'
import type { Tour as ApiTour } from '@/shared/types/api'

function cloneTours(tours: Tour[]) {
  return tours.map((tour) => ({ ...tour }))
}

function buildTourSummary(apiTour: ApiTour) {
  const firstParagraph = apiTour.description
    .split(/\n+/)
    .map((segment) => segment.trim())
    .find(Boolean)

  if (firstParagraph) {
    return firstParagraph
  }

  return `Explore ${apiTour.destination} with a curated itinerary and verified departure planning.`
}

function getLowestLivePrice(apiTour: ApiTour) {
  const priceRules = (apiTour.schedules ?? []).flatMap((schedule) => schedule.price_rules ?? [])
  const lowestRule = priceRules.reduce<typeof priceRules[number] | null>((lowest, rule) => {
    if (!lowest || rule.price < lowest.price) {
      return rule
    }

    return lowest
  }, null)

  return {
    amount: lowestRule?.price ?? apiTour.price ?? 0,
    currency: lowestRule?.currency ?? 'USD',
  }
}

function getMaxGroupSize(apiTour: ApiTour) {
  return (apiTour.schedules ?? []).reduce((largest, schedule) => {
    return Math.max(largest, schedule.capacity)
  }, 0)
}

function getAvailability(apiTour: ApiTour): Tour['availability'] {
  const totalAvailableSlots = (apiTour.schedules ?? []).reduce((total, schedule) => {
    return total + Math.max(schedule.available_slots, 0)
  }, 0)

  if (totalAvailableSlots === 0) {
    return 'sold_out'
  }

  if (totalAvailableSlots <= 8) {
    return 'limited'
  }

  return 'available'
}

function getTourImageContent(apiTour: ApiTour, destinations: Destination[]) {
  const destinationContent = findMatchingDestinationContent(apiTour, destinations)

  if (destinationContent) {
    return {
      imageUrl: destinationContent.imageUrl,
      imageAlt: destinationContent.imageAlt,
      featuredLabel: destinationContent.eyebrow,
    }
  }

  return {
    imageUrl: '/images/hero-banner.jpg',
    imageAlt: `Scenic travel view for ${apiTour.destination}.`,
    featuredLabel: 'Curated Departure',
  }
}

function mapApiTourToCardModel(apiTour: ApiTour, destinations: Destination[]): Tour {
  const imageContent = getTourImageContent(apiTour, destinations)
  const lowestPrice = getLowestLivePrice(apiTour)

  return {
    id: apiTour.id,
    slug: apiTour.id,
    destination: apiTour.destination,
    name: apiTour.name,
    summary: buildTourSummary(apiTour),
    durationDays: apiTour.duration_days,
    maxGroupSize: getMaxGroupSize(apiTour) || 12,
    price: lowestPrice.amount,
    currency: lowestPrice.currency,
    imageUrl: imageContent.imageUrl,
    imageAlt: imageContent.imageAlt,
    availability: getAvailability(apiTour),
    featuredLabel: imageContent.featuredLabel,
  }
}

export async function getFeaturedTours(signal?: AbortSignal): Promise<Tour[]> {
  void signal
  const [response, destinations] = await Promise.all([
    apiClient.searchTours({ limit: 12, offset: 0 }),
    apiClient.getDestinations().catch(() => []),
  ])
  return cloneTours(response.tours.map((tour) => mapApiTourToCardModel(tour, destinations)).slice(0, 3))
}

export async function searchTours(
  params: TourSearchParams = {},
  signal?: AbortSignal,
): Promise<Tour[]> {
  void signal
  const normalizedParams = normalizeTourSearchParams(params)
  const [response, destinations] = await Promise.all([
    apiClient.searchTours(normalizedParams),
    apiClient.getDestinations().catch(() => []),
  ])
  return cloneTours(response.tours.map((tour) => mapApiTourToCardModel(tour, destinations)))
}

export async function getTourDetailById(id: string, signal?: AbortSignal): Promise<ApiTour | null> {
  void signal
  return apiClient.getTourById(id)
}

export const toursApi = {
  getFeaturedTours,
  searchTours,
  getTourDetailById,
}
