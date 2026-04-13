import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  buildCheckoutPath,
  buildPaymentPath,
  buildTourSchedulesPath,
} from '@/app/router/routePaths'
import { env } from '@/app/config/env'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { formatDateLabel, useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'
import type { TourPriceRule } from '@/features/tours/queries/useTourDetailQuery'

function formatScheduleRange(departureDate?: string, returnDate?: string) {
  if (!departureDate || !returnDate) {
    return 'Schedule pending'
  }

  return `${formatDateLabel(departureDate)} - ${formatDateLabel(returnDate)}`
}

function parseTravelerCount(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsedValue)) {
    return fallback
  }

  return Math.max(0, Math.min(parsedValue, 20))
}

function normalizeTravelerCounts(counts: {
  adultCount: number
  childCount: number
  infantCount: number
}) {
  const normalizedCounts = {
    adultCount: Math.max(0, Math.min(Math.floor(counts.adultCount), 20)),
    childCount: Math.max(0, Math.min(Math.floor(counts.childCount), 20)),
    infantCount: Math.max(0, Math.min(Math.floor(counts.infantCount), 20)),
  }

  if (
    normalizedCounts.adultCount +
      normalizedCounts.childCount +
      normalizedCounts.infantCount <=
    0
  ) {
    normalizedCounts.adultCount = 1
  }

  return normalizedCounts
}

function buildTravelerLabel(counts: {
  adultCount: number
  childCount: number
  infantCount: number
}) {
  const segments = [
    counts.adultCount > 0
      ? `${counts.adultCount} adult${counts.adultCount === 1 ? '' : 's'}`
      : null,
    counts.childCount > 0
      ? `${counts.childCount} child${counts.childCount === 1 ? '' : 'ren'}`
      : null,
    counts.infantCount > 0
      ? `${counts.infantCount} infant${counts.infantCount === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean)

  return segments.join(', ')
}

function findPriceRuleAmount(
  priceRules: TourPriceRule[] | undefined,
  travelerType: TourPriceRule['traveler_type'],
) {
  return priceRules?.find((rule) => rule.traveler_type === travelerType)?.price ?? 0
}

export function useCheckoutContext() {
  const [searchParams, setSearchParams] = useSearchParams()
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

  const travelerCounts = normalizeTravelerCounts({
    adultCount: parseTravelerCount(searchParams.get('adultCount'), 1),
    childCount: parseTravelerCount(searchParams.get('childCount'), 0),
    infantCount: parseTravelerCount(searchParams.get('infantCount'), 0),
  })
  const travelerCount =
    travelerCounts.adultCount +
    travelerCounts.childCount +
    travelerCounts.infantCount
  const adultPrice = findPriceRuleAmount(selectedSchedule?.price_rules, 'adult')
  const childPrice = findPriceRuleAmount(selectedSchedule?.price_rules, 'child')
  const infantPrice = findPriceRuleAmount(selectedSchedule?.price_rules, 'infant')
  const fallbackPerTravelerAmount =
    selectedSchedule?.price_rules?.[0]?.price ??
    detailQuery.data?.priceSummary.amount ??
    0
  const perTravelerAmount = travelerCount > 0
    ? (
        adultPrice * travelerCounts.adultCount +
        childPrice * travelerCounts.childCount +
        infantPrice * travelerCounts.infantCount
      ) / travelerCount
    : fallbackPerTravelerAmount

  const totalAmount =
    adultPrice * travelerCounts.adultCount +
    childPrice * travelerCounts.childCount +
    infantPrice * travelerCounts.infantCount ||
    fallbackPerTravelerAmount * travelerCount
  const effectiveTourId = detailQuery.data?.id ?? requestedTourId
  const effectiveScheduleId = selectedSchedule?.id
  const leadTravelerName =
    authUser?.name?.trim() ||
    authUser?.full_name?.trim() ||
    (env.enableMocks ? 'Alexander Sterling' : undefined)
  const travelerLabel = buildTravelerLabel(travelerCounts)
  const availableSlots = selectedSchedule?.available_slots

  const updateTravelerCounts = (nextCounts: Partial<typeof travelerCounts>) => {
    const resolvedCounts = normalizeTravelerCounts({
      ...travelerCounts,
      ...nextCounts,
    })
    const nextSearchParams = new URLSearchParams()

    if (effectiveTourId) {
      nextSearchParams.set('tourId', effectiveTourId)
    }
    if (effectiveScheduleId) {
      nextSearchParams.set('scheduleId', effectiveScheduleId)
    }
    if (paymentId) {
      nextSearchParams.set('paymentId', paymentId)
    }
    if (bookingId) {
      nextSearchParams.set('bookingId', bookingId)
    }
    nextSearchParams.set('adultCount', String(resolvedCounts.adultCount))
    nextSearchParams.set('childCount', String(resolvedCounts.childCount))
    nextSearchParams.set('infantCount', String(resolvedCounts.infantCount))

    setSearchParams(
      nextSearchParams,
      { replace: true },
    )
  }

  return {
    detailQuery,
    travelerCount,
    travelerCounts,
    updateTravelerCounts,
    availableSlots,
    bookingId,
    paymentId,
    tourId: effectiveTourId,
    scheduleId: effectiveScheduleId,
    checkoutPath: buildCheckoutPath({
      tourId: effectiveTourId,
      scheduleId: effectiveScheduleId,
      bookingId,
      adultCount: travelerCounts.adultCount,
      childCount: travelerCounts.childCount,
      infantCount: travelerCounts.infantCount,
    }),
    paymentPath: buildPaymentPath({
      tourId: effectiveTourId,
      scheduleId: effectiveScheduleId,
      bookingId,
      adultCount: travelerCounts.adultCount,
      childCount: travelerCounts.childCount,
      infantCount: travelerCounts.infantCount,
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
    travelerLabel,
  }
}
