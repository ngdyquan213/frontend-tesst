import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  buildCheckoutPath,
  buildPaymentPath,
  buildTourSchedulesPath,
} from '@/app/router/routePaths'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { formatDateLabel, useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'
import { MOCK_DEFAULT_TRAVELER_NAME } from '@/shared/api/mockAuth'
import { isMockApiEnabled } from '@/shared/api/mockMode'

function formatScheduleRange(departureDate?: string, returnDate?: string) {
  if (!departureDate || !returnDate) {
    return 'Schedule pending'
  }

  return `${formatDateLabel(departureDate)} - ${formatDateLabel(returnDate)}`
}

function isUuidLike(value?: string) {
  if (!value) {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export function useCheckoutContext() {
  const [searchParams] = useSearchParams()
  const authUser = useAuthStore((state) => state.user)
  const requestedTourId = searchParams.get('tourId')?.trim() || undefined
  const requestedScheduleId = searchParams.get('scheduleId')?.trim() || undefined
  const paymentId = searchParams.get('paymentId')?.trim() || undefined
  const bookingId = searchParams.get('bookingId')?.trim() || undefined
  const detailQuery = useTourDetailQuery(requestedTourId)

  const selectedSchedule = useMemo(() => {
    const schedules = detailQuery.data?.schedules ?? []

    if (requestedScheduleId) {
      return schedules.find((schedule) => schedule.id === requestedScheduleId) ?? schedules[0]
    }

    return schedules[0]
  }, [detailQuery.data?.schedules, requestedScheduleId])

  const travelerCount = 1
  const perTravelerAmount =
    selectedSchedule?.price_rules?.[0]?.price ??
    detailQuery.data?.priceSummary.amount ??
    0

  const totalAmount = perTravelerAmount * travelerCount
  const effectiveTourId = detailQuery.data?.id ?? requestedTourId
  const effectiveScheduleId = selectedSchedule?.id
  const isLegacyMockTour = !isUuidLike(requestedTourId) || !isUuidLike(detailQuery.data?.id)
  const leadTravelerName =
    authUser?.name?.trim() ||
    authUser?.full_name?.trim() ||
    ((isMockApiEnabled() || isLegacyMockTour) ? MOCK_DEFAULT_TRAVELER_NAME : undefined)

  return {
    detailQuery,
    travelerCount,
    bookingId,
    paymentId,
    tourId: effectiveTourId,
    scheduleId: effectiveScheduleId,
    checkoutPath: buildCheckoutPath({
      tourId: effectiveTourId,
      scheduleId: effectiveScheduleId,
      bookingId,
    }),
    paymentPath: buildPaymentPath({
      tourId: effectiveTourId,
      scheduleId: effectiveScheduleId,
      bookingId,
    }),
    schedulesPath: buildTourSchedulesPath(effectiveTourId),
    scheduleLabel: formatScheduleRange(
      selectedSchedule?.departure_date,
      selectedSchedule?.return_date,
    ),
    selectedSchedule,
    totalAmount,
    perTravelerAmount,
    leadTravelerName,
    tourName: detailQuery.data?.name ?? 'selected trip',
    destinationLabel: detailQuery.data?.destination ?? 'TravelBook itinerary',
    travelerLabel: '1 traveler will be finalized after booking confirmation',
  }
}
