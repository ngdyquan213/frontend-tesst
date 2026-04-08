import { env } from '@/app/config/env'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { tours } from '@/shared/api/mockData'
import type { Tour } from '@/shared/types/common'

export type AdminTourStatus = 'active' | 'inactive'

export interface AdminTourRecord {
  id: string
  code: string
  title: string
  location: string
  description: string
  durationDays: number
  durationNights: number
  meetingPoint: string
  tourType: string
  status: AdminTourStatus
  priceFrom: number
  scheduleCount: number
}

export interface AdminTourCreatePayload {
  code: string
  name: string
  destination: string
  description: string
  durationDays: number
  durationNights: number
  meetingPoint: string
  tourType: string
  status: AdminTourStatus
}

export interface AdminTourUpdatePayload extends Omit<AdminTourCreatePayload, 'code'> {
  id: string
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tour'
  )
}

function buildMockTourCode(title: string, id: string) {
  const source = slugify(title || id).toUpperCase().replace(/-/g, '_')
  return `TB_${source.slice(0, 18) || 'TOUR'}`
}

type MockAdminTourMetadata = Tour & {
  adminCode?: string
  adminStatus?: AdminTourStatus
}

function getMockTourCode(tour: Tour) {
  return (tour as MockAdminTourMetadata).adminCode ?? buildMockTourCode(tour.title, tour.id)
}

function getMockTourStatus(tour: Tour): AdminTourStatus {
  const metadataStatus = (tour as MockAdminTourMetadata).adminStatus
  if (metadataStatus) {
    return metadataStatus
  }

  return tour.availability === 'Paused' ? 'inactive' : 'active'
}

function normalizeStatus(value?: string | null): AdminTourStatus {
  return value?.trim().toLowerCase() === 'inactive' ? 'inactive' : 'active'
}

function mapAdminTourRecord(tour: Awaited<ReturnType<typeof apiClient.getAdminTours>>['tours'][number]): AdminTourRecord {
  const lowestPrice =
    tour.schedules?.flatMap((schedule) => schedule.price_rules ?? []).reduce<number | null>(
      (currentLowest, rule) => {
        if (currentLowest === null || rule.price < currentLowest) {
          return rule.price
        }

        return currentLowest
      },
      null,
    ) ?? tour.price ?? 0

  return {
    id: tour.id,
    code: tour.code?.trim() || buildMockTourCode(tour.name, tour.id),
    title: tour.name,
    location: tour.destination,
    description: tour.description?.trim() || 'No operational description provided yet.',
    durationDays: tour.duration_days,
    durationNights: tour.duration_nights ?? Math.max(tour.duration_days - 1, 0),
    meetingPoint: tour.meeting_point?.trim() || 'Not set',
    tourType: tour.tour_type?.trim() || 'General tour',
    status: normalizeStatus(tour.status),
    priceFrom: lowestPrice,
    scheduleCount: tour.schedules?.length ?? 0,
  }
}

export const adminToursApi = {
  getTours: async () => {
    if (env.enableMocks) {
      return resolveAfter(
        tours.map((tour) =>
          mapAdminTourRecord({
            id: tour.id,
            name: tour.title,
            destination: tour.location,
            description: tour.summary,
            duration_days: tour.durationDays,
            duration_nights: Math.max(tour.durationDays - 1, 0),
            meeting_point: '',
            tour_type: tour.activityLevel,
            status: getMockTourStatus(tour),
            code: getMockTourCode(tour),
            schedules: [],
            price: tour.priceFrom,
          }),
        ),
      )
    }

    const response = await apiClient.getAdminTours()
    return response.tours.map(mapAdminTourRecord)
  },

  createTour: async (payload: AdminTourCreatePayload) => {
    if (env.enableMocks) {
      const nextId = `tour-${Date.now()}`
      const fallbackImage = tours[0]?.heroImage ?? ''
      const nextTour = {
        id: nextId,
        slug: slugify(payload.name),
        title: payload.name,
        location: payload.destination,
        destinationId: tours[0]?.destinationId ?? 'dest-amalfi',
        summary: payload.description || 'Created from the admin tour workspace.',
        overview: payload.description ? [payload.description] : ['Created from the admin tour workspace.'],
        highlights: [],
        itinerary: [],
        durationDays: payload.durationDays,
        groupSize: 12,
        activityLevel: payload.tourType || 'General tour',
        availability: payload.status === 'active' ? 'Open for sale' : 'Paused',
        priceFrom: 0,
        heroImage: fallbackImage,
        cardImage: tours[0]?.cardImage ?? fallbackImage,
        gallery: [],
        badge: payload.status === 'active' ? 'New' : 'Inactive',
        operator: 'TravelBook Operations',
        instantConfirmation: false,
        adminCode: payload.code,
        adminStatus: payload.status,
      } satisfies MockAdminTourMetadata
      tours.unshift(nextTour)

      return resolveAfter(
        mapAdminTourRecord({
          id: nextId,
          name: payload.name,
          destination: payload.destination,
          description: payload.description,
          duration_days: payload.durationDays,
          duration_nights: payload.durationNights,
          meeting_point: payload.meetingPoint,
          tour_type: payload.tourType,
          status: payload.status,
          code: payload.code,
          price: 0,
          schedules: [],
        }),
      )
    }

    const createdTour = await apiClient.createAdminTour({
      code: payload.code,
      name: payload.name,
      destination: payload.destination,
      description: payload.description || undefined,
      duration_days: payload.durationDays,
      duration_nights: payload.durationNights,
      meeting_point: payload.meetingPoint || undefined,
      tour_type: payload.tourType || undefined,
      status: payload.status,
    })

    return mapAdminTourRecord(createdTour)
  },

  updateTour: async (payload: AdminTourUpdatePayload) => {
    if (env.enableMocks) {
      const tour = tours.find((item) => item.id === payload.id)

      if (!tour) {
        throw new Error('Tour not found.')
      }

      tour.title = payload.name
      tour.location = payload.destination
      tour.summary = payload.description || tour.summary
      tour.overview = payload.description ? [payload.description] : tour.overview
      tour.durationDays = payload.durationDays
      tour.activityLevel = payload.tourType || tour.activityLevel
      tour.availability = payload.status === 'active' ? 'Open for sale' : 'Paused'
      tour.badge = payload.status === 'active' ? 'Updated' : 'Inactive'
      ;(tour as MockAdminTourMetadata).adminStatus = payload.status

      return resolveAfter(
        mapAdminTourRecord({
          id: tour.id,
          name: payload.name,
          destination: payload.destination,
          description: payload.description,
          duration_days: payload.durationDays,
          duration_nights: payload.durationNights,
          meeting_point: payload.meetingPoint,
          tour_type: payload.tourType,
          status: payload.status,
          code: getMockTourCode(tour),
          price: tour.priceFrom,
          schedules: [],
        }),
      )
    }

    const updatedTour = await apiClient.updateAdminTour(payload.id, {
      name: payload.name,
      destination: payload.destination,
      description: payload.description || undefined,
      duration_days: payload.durationDays,
      duration_nights: payload.durationNights,
      meeting_point: payload.meetingPoint || undefined,
      tour_type: payload.tourType || undefined,
      status: payload.status,
    })

    return mapAdminTourRecord(updatedTour)
  },
}
