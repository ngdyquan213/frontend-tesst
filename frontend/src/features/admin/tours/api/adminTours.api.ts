import { apiClient } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/types/pagination'

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

function buildMockTourCode(title: string, id: string) {
  const source = (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || id || 'tour'
  ).toUpperCase().replace(/-/g, '_')
  return `TB_${source.slice(0, 18) || 'TOUR'}`
}

function normalizeStatus(value?: string | null): AdminTourStatus {
  return value?.trim().toLowerCase() === 'inactive' ? 'inactive' : 'active'
}

function mapAdminTourRecord(
  tour: Awaited<ReturnType<typeof apiClient.getAdminTours>>['tours'][number],
): AdminTourRecord {
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
  getTours: async (
    page = 1,
    pageSize = 10,
  ): Promise<PaginatedResult<AdminTourRecord>> => {
    const offset = (page - 1) * pageSize
    const response = await apiClient.getAdminTours(pageSize, offset)

    return {
      items: response.tours.map(mapAdminTourRecord),
      meta: {
        page,
        pageSize,
        total: response.total,
      },
    }
  },

  createTour: async (payload: AdminTourCreatePayload) => {
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
