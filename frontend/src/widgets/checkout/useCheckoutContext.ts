import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  buildCheckoutPath,
  buildPaymentPath,
  buildTourSchedulesPath,
} from '@/app/router/routePaths'
import { useTravelersQuery } from '@/features/travelers/queries/useTravelersQuery'
import { formatDateLabel, useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'

function formatScheduleRange(departureDate?: string, returnDate?: string) {
  if (!departureDate || !returnDate) {
    return 'Schedule pending'
  }

  return `${formatDateLabel(departureDate)} - ${formatDateLabel(returnDate)}`
}

export function useCheckoutContext() {
  const [searchParams] = useSearchParams()
  const requestedTourId = searchParams.get('tourId')?.trim() || undefined
  const requestedScheduleId = searchParams.get('scheduleId')?.trim() || undefined
  const paymentId = searchParams.get('paymentId')?.trim() || undefined
  const detailQuery = useTourDetailQuery(requestedTourId)
  const travelersQuery = useTravelersQuery()

  const selectedSchedule = useMemo(() => {
    const schedules = detailQuery.data?.schedules ?? []

    if (requestedScheduleId) {
      return schedules.find((schedule) => schedule.id === requestedScheduleId) ?? schedules[0]
    }

    return schedules[0]
  }, [detailQuery.data?.schedules, requestedScheduleId])

  const travelers = travelersQuery.data ?? []
  const leadTraveler = travelers.find((traveler) => traveler.isPrimary) ?? travelers[0]
  const travelerCount = travelers.length
  const travelerCountForPricing = Math.max(travelerCount, 1)
  const perTravelerAmount =
    selectedSchedule?.price_rules?.[0]?.price ??
    detailQuery.data?.priceSummary.amount ??
    0

  const totalAmount = perTravelerAmount * travelerCountForPricing
  const effectiveTourId = detailQuery.data?.id ?? requestedTourId
  const effectiveScheduleId = selectedSchedule?.id

  return {
    detailQuery,
    travelersQuery,
    travelers,
    leadTraveler,
    travelerCount,
    paymentId,
    tourId: effectiveTourId,
    scheduleId: effectiveScheduleId,
    checkoutPath: buildCheckoutPath({
      tourId: effectiveTourId,
      scheduleId: effectiveScheduleId,
    }),
    paymentPath: buildPaymentPath({
      tourId: effectiveTourId,
      scheduleId: effectiveScheduleId,
    }),
    schedulesPath: buildTourSchedulesPath(effectiveTourId),
    scheduleLabel: formatScheduleRange(
      selectedSchedule?.departure_date,
      selectedSchedule?.return_date,
    ),
    selectedSchedule,
    totalAmount,
    perTravelerAmount,
    tourName: detailQuery.data?.name ?? 'selected trip',
    destinationLabel: detailQuery.data?.destination ?? 'TravelBook itinerary',
    travelerLabel:
      travelerCount === 0
        ? 'Traveler details pending'
        : travelerCount === 1
          ? '1 traveler confirmed'
          : `${travelerCount} travelers confirmed`,
  }
}
