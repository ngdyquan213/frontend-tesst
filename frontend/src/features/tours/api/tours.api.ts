import {
  findMatchingVisualTour,
  getMockFeaturedToursSnapshot,
  getMockTourCatalogSnapshot,
} from '@/features/tours/lib/tourVisualData'
import { normalizeTourSearchParams } from '@/features/tours/model/tour.schema'
import type { Tour, TourSearchParams } from '@/features/tours/model/tour.types'
import { apiClient } from '@/shared/api/apiClient'
import { isMockApiEnabled } from '@/shared/api/mockMode'
import type { Tour as ApiTour } from '@/shared/types/api'

function wait(duration = 450, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler)
      }
      resolve()
    }, duration)

    function abortHandler() {
      globalThis.clearTimeout(timeoutId)
      reject(new DOMException('Request aborted.', 'AbortError'))
    }

    if (!signal) {
      return
    }

    if (signal.aborted) {
      abortHandler()
      return
    }

    signal.addEventListener('abort', abortHandler, { once: true })
  })
}

function cloneTours(tours: Tour[]) {
  return tours.map((tour) => ({ ...tour }))
}

function matchesDestination(tour: Tour, destination?: string) {
  if (!destination) {
    return true
  }

  const keyword = destination.trim().toLowerCase()
  const searchableText = `${tour.name} ${tour.destination} ${tour.summary}`.toLowerCase()

  return searchableText.includes(keyword)
}

function matchesDuration(tour: Tour, duration?: TourSearchParams['duration']) {
  switch (duration) {
    case 'short':
      return tour.durationDays <= 5
    case 'medium':
      return tour.durationDays >= 6 && tour.durationDays <= 9
    case 'long':
      return tour.durationDays >= 10
    default:
      return true
  }
}

function matchesGroupSize(tour: Tour, groupSize?: TourSearchParams['groupSize']) {
  switch (groupSize) {
    case 'intimate':
      return tour.maxGroupSize <= 8
    case 'shared':
      return tour.maxGroupSize >= 9 && tour.maxGroupSize <= 12
    case 'large':
      return tour.maxGroupSize >= 13
    default:
      return true
  }
}

function matchesPriceRange(tour: Tour, priceRange?: TourSearchParams['priceRange']) {
  switch (priceRange) {
    case 'under-1500':
      return tour.price < 1500
    case '1500-2500':
      return tour.price >= 1500 && tour.price <= 2500
    case '2500-plus':
      return tour.price > 2500
    default:
      return true
  }
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

function mapApiTourToCardModel(apiTour: ApiTour): Tour {
  const visualTour = findMatchingVisualTour(apiTour)
  const lowestPrice = getLowestLivePrice(apiTour)

  return {
    id: apiTour.id,
    slug: apiTour.id,
    destination: apiTour.destination,
    name: apiTour.name,
    summary: buildTourSummary(apiTour),
    durationDays: apiTour.duration_days,
    maxGroupSize: getMaxGroupSize(apiTour) || visualTour.maxGroupSize,
    price: lowestPrice.amount,
    currency: lowestPrice.currency,
    imageUrl: visualTour.imageUrl,
    imageAlt: visualTour.imageAlt,
    availability: getAvailability(apiTour),
    featuredLabel: 'Instant Confirmation',
  }
}

function applyClientFilters(tours: Tour[], params: TourSearchParams) {
  const filteredTours = tours.filter((tour) => {
    return (
      matchesDestination(tour, params.destination) &&
      matchesDuration(tour, params.duration) &&
      matchesGroupSize(tour, params.groupSize) &&
      matchesPriceRange(tour, params.priceRange)
    )
  })

  return typeof params.limit === 'number' ? filteredTours.slice(0, params.limit) : filteredTours
}

export async function getFeaturedTours(signal?: AbortSignal): Promise<Tour[]> {
  if (!isMockApiEnabled()) {
    const response = await apiClient.searchTours({ limit: 12, offset: 0 })
    return cloneTours(response.tours.map(mapApiTourToCardModel).slice(0, 3))
  }

  await wait(380, signal)
  return getMockFeaturedToursSnapshot()
}

export function getTourCatalogSnapshot(): Tour[] {
  return getMockTourCatalogSnapshot()
}

export async function getTourCatalogSnapshotAsync(): Promise<Tour[]> {
  return getMockTourCatalogSnapshot()
}

export async function searchTours(params: TourSearchParams = {}, signal?: AbortSignal): Promise<Tour[]> {
  const normalizedParams = normalizeTourSearchParams(params)

  if (!isMockApiEnabled()) {
    const response = await apiClient.searchTours(normalizedParams)
    return cloneTours(response.tours.map(mapApiTourToCardModel))
  }

  await wait(520, signal)
  return cloneTours(applyClientFilters(getMockTourCatalogSnapshot(), normalizedParams))
}

export async function getTourDetailById(id: string, signal?: AbortSignal): Promise<ApiTour | null> {
  await wait(420, signal)
  const { getMockTourDetailById: getMockTourDetailSnapshotById } = await import(
    '@/features/tours/lib/tourMockData'
  )
  return getMockTourDetailSnapshotById(id)
}

export const toursApi = {
  getFeaturedTours,
  getTourCatalogSnapshot,
  getTourCatalogSnapshotAsync,
  searchTours,
  getTourDetailById,
}
