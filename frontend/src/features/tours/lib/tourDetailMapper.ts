import type { Destination } from '@/features/destinations/model/destination.types'
import type { DestinationHighlight } from '@/features/tours/model/tour.types'
import type { Tour as ApiTour } from '@/shared/types/api'

export type TourSchedule = NonNullable<ApiTour['schedules']>[number]
export type TourPriceRule = NonNullable<TourSchedule['price_rules']>[number]
export type TourItineraryItem = NonNullable<ApiTour['itineraries']>[number]
export type TourPolicy = NonNullable<ApiTour['policies']>[number]

export interface TourHeroBadge {
  label: string
  tone: 'verified' | 'instant'
}

export interface TourHeroFact {
  label: string
  value: string
  accent?: boolean
}

export interface TourFaqItem {
  question: string
  answer: string
}

export interface TourPriceSummary {
  amount: number | null
  currency: string
  displayPrice: string
  nextDepartureLabel: string
  capacityLabel: string
}

export interface TourDetail {
  id: string
  code?: string
  name: string
  destination: string
  description: string
  durationDays: number
  durationNights: number
  meetingPoint?: string
  tourType?: string
  status: string
  overviewParagraphs: string[]
  itinerary: TourItineraryItem[]
  policies: TourPolicy[]
  schedules: TourSchedule[]
  heroImageUrl: string
  heroImageAlt: string
  heroBadges: TourHeroBadge[]
  facts: TourHeroFact[]
  highlights: DestinationHighlight[]
  faqItems: TourFaqItem[]
  priceSummary: TourPriceSummary
  bookingPreviewNote: string
}

const DEFAULT_VISUAL_PRESET = {
  heroImageUrl:
    '/images/hero-banner.jpg',
  heroImageAlt: 'Premium coastal travel destination with bright water and clear skies.',
  highlights: [
    {
      title: 'Signature Scenery',
      description:
        'Every departure is framed around the destination views and moments that define the journey.',
      imageUrl:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Scenic travel landscape with mountains, lakes, and open sky.',
    },
    {
      title: 'Curated Pacing',
      description:
        'Structured itineraries balance movement, downtime, and premium support throughout the route.',
      imageUrl:
        'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Traveler overlooking a scenic horizon from a carefully planned viewpoint.',
    },
  ],
}

export function formatStatusLabel(value?: string) {
  if (!value) {
    return 'Curated'
  }

  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function formatTravelerType(value?: string) {
  if (!value) {
    return 'Standard traveler'
  }

  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function splitOverviewParagraphs(tour: ApiTour) {
  const paragraphs = tour.description
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (paragraphs.length >= 2) {
    return paragraphs
  }

  const fallbackParagraphs = [...paragraphs]

  if (fallbackParagraphs.length === 0) {
    fallbackParagraphs.push(
      `A premium ${tour.destination.toLowerCase()} itinerary designed for travelers who want clarity, secure planning, and elevated on-the-ground support.`,
    )
  }

  const supportingDetails = [
    tour.meeting_point ? `Meeting point: ${tour.meeting_point}.` : null,
    tour.tour_type ? `Travel style: ${tour.tour_type}.` : null,
    tour.schedules && tour.schedules.length > 0
      ? `${tour.schedules.length} published departure${tour.schedules.length === 1 ? '' : 's'} currently available for planning.`
      : 'Departure schedules are published on demand and confirmed by the operations team.',
  ].filter(Boolean)

  if (supportingDetails.length > 0) {
    fallbackParagraphs.push(supportingDetails.join(' '))
  }

  return fallbackParagraphs
}

function sortSchedules(schedules: TourSchedule[]) {
  return [...schedules].sort(
    (left, right) =>
      new Date(left.departure_date).getTime() - new Date(right.departure_date).getTime(),
  )
}

function sortItinerary(itinerary: TourItineraryItem[]) {
  return [...itinerary].sort((left, right) => left.day_number - right.day_number)
}

function findLowestPriceRule(schedules: TourSchedule[]) {
  return schedules.flatMap((schedule) => schedule.price_rules ?? []).reduce<TourPriceRule | null>(
    (lowest, rule) => {
      if (!lowest || rule.price < lowest.price) {
        return rule
      }

      return lowest
    },
    null,
  )
}

function formatCurrencyValue(amount: number | null, currency = 'USD') {
  if (amount === null) {
    return 'On request'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

export function formatDateLabel(value?: string) {
  if (!value) {
    return 'Schedule on request'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Schedule on request'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate)
}

function buildAvailabilityLabel(schedules: TourSchedule[], status?: string) {
  if (schedules.length === 0) {
    return formatStatusLabel(status) === 'Curated' ? 'On request' : formatStatusLabel(status)
  }

  const totalAvailableSlots = schedules.reduce(
    (total, schedule) => total + Math.max(schedule.available_slots, 0),
    0,
  )

  if (totalAvailableSlots === 0) {
    return 'Sold out'
  }

  if (totalAvailableSlots <= 12) {
    return 'Limited'
  }

  return `${schedules.length} departures`
}

function buildActivityLevelLabel(tourType?: string) {
  const normalizedType = tourType?.toLowerCase() ?? ''

  if (normalizedType.includes('trail') || normalizedType.includes('expedition')) {
    return 'Moderate'
  }

  if (normalizedType.includes('sailing')) {
    return 'Curated active'
  }

  if (normalizedType.includes('heritage') || normalizedType.includes('cultural')) {
    return 'Leisurely'
  }

  return 'Moderate'
}

function buildGroupSizeLabel(schedules: TourSchedule[]) {
  const maxCapacity = schedules.reduce(
    (largest, schedule) => Math.max(largest, schedule.capacity),
    0,
  )

  return maxCapacity > 0 ? `Max ${maxCapacity} guests` : 'Small group'
}

function buildHighlights(tour: ApiTour, destinationContent?: Destination | null) {
  if (destinationContent) {
    return [
      {
        title: destinationContent.signatureLabel,
        description: destinationContent.summary,
        imageUrl: destinationContent.imageUrl,
        imageAlt: destinationContent.imageAlt,
      },
      {
        title: destinationContent.eyebrow,
        description: destinationContent.description,
        imageUrl: destinationContent.imageUrl,
        imageAlt: destinationContent.imageAlt,
      },
    ]
  }

  const itineraryHighlights = sortItinerary(tour.itineraries ?? []).slice(0, 2)

  if (itineraryHighlights.length === 0) {
    return DEFAULT_VISUAL_PRESET.highlights
  }

  return itineraryHighlights.map((item, index) => ({
    title: item.title,
    description:
      item.description ??
      `Day ${item.day_number} is shaped as one of the signature moments on this curated itinerary.`,
    imageUrl:
      DEFAULT_VISUAL_PRESET.highlights[index % DEFAULT_VISUAL_PRESET.highlights.length].imageUrl,
    imageAlt:
      DEFAULT_VISUAL_PRESET.highlights[index % DEFAULT_VISUAL_PRESET.highlights.length].imageAlt,
  }))
}

function buildFaqItems(tour: ApiTour) {
  const faqItems: TourFaqItem[] = []

  for (const policy of tour.policies ?? []) {
    if (policy.cancellation_policy) {
      faqItems.push({
        question: 'What is the cancellation policy?',
        answer: policy.cancellation_policy,
      })
    }

    if (policy.refund_policy) {
      faqItems.push({
        question: 'How are refunds handled?',
        answer: policy.refund_policy,
      })
    }

    if (policy.notes) {
      faqItems.push({
        question: 'Anything else to know before departure?',
        answer: policy.notes,
      })
    }
  }

  if (tour.meeting_point) {
    faqItems.push({
      question: 'Where does the journey begin?',
      answer: `Your current meeting point is ${tour.meeting_point}. Final joining details are confirmed with your departure documents after reservation.`,
    })
  }

  if (tour.schedules && tour.schedules.length > 0) {
    faqItems.push({
      question: 'Can I compare departure options now?',
      answer:
        'Yes. Published departures, current seat availability, and traveler pricing are already listed below for comparison.',
    })
  }

  if (faqItems.length > 0) {
    return faqItems.slice(0, 3)
  }

  return [
    {
      question: 'When will departure details appear?',
      answer:
        'Schedules are published as soon as operations confirms inventory and pricing for a departure.',
    },
    {
      question: 'Can I start planning before I reserve?',
      answer:
        'Yes. You can review the itinerary, compare dates, and choose the departure that best fits your trip before reserving.',
    },
    {
      question: 'Will I receive support for this tour?',
      answer:
        'Every itinerary is positioned as a premium, concierge-ready experience with secure scheduling and traveler support in mind.',
    },
  ]
}

function buildPriceSummary(schedules: TourSchedule[]) {
  const sortedSchedules = sortSchedules(schedules)
  const nextDeparture = sortedSchedules[0]
  const lowestPriceRule = findLowestPriceRule(sortedSchedules)
  const amount = lowestPriceRule?.price ?? null
  const currency = lowestPriceRule?.currency ?? 'USD'

  return {
    amount,
    currency,
    displayPrice: formatCurrencyValue(amount, currency),
    nextDepartureLabel: formatDateLabel(nextDeparture?.departure_date),
    capacityLabel:
      nextDeparture && nextDeparture.capacity > 0
        ? `${Math.max(nextDeparture.available_slots, 0)} of ${nextDeparture.capacity} spots left`
        : 'Capacity updates on request',
  }
}

function buildFacts(tour: ApiTour, schedules: TourSchedule[]) {
  return [
    {
      label: 'Duration',
      value: `${tour.duration_days} days`,
    },
    {
      label: 'Group Size',
      value: buildGroupSizeLabel(schedules),
    },
    {
      label: 'Activity Level',
      value: buildActivityLevelLabel(tour.tour_type),
    },
    {
      label: 'Availability',
      value: buildAvailabilityLabel(schedules, tour.status),
      accent: true,
    },
  ]
}

export function buildTourDetail(rawTour: ApiTour, destinationContent?: Destination | null): TourDetail {
  const schedules = sortSchedules(rawTour.schedules ?? [])

  return {
    id: rawTour.id,
    code: rawTour.code,
    name: rawTour.name,
    destination: rawTour.destination,
    description: rawTour.description,
    durationDays: rawTour.duration_days,
    durationNights: rawTour.duration_nights ?? Math.max(rawTour.duration_days - 1, 0),
    meetingPoint: rawTour.meeting_point,
    tourType: rawTour.tour_type,
    status: formatStatusLabel(rawTour.status),
    overviewParagraphs: splitOverviewParagraphs(rawTour),
    itinerary: sortItinerary(rawTour.itineraries ?? []),
    policies: rawTour.policies ?? [],
    schedules,
    heroImageUrl: destinationContent?.imageUrl ?? DEFAULT_VISUAL_PRESET.heroImageUrl,
    heroImageAlt:
      destinationContent?.imageAlt ??
      `Scenic travel destination in ${rawTour.destination}.`,
    heroBadges: [
      { label: 'Verified Tour', tone: 'verified' },
      { label: 'Instant Confirmation', tone: 'instant' },
    ],
    facts: buildFacts(rawTour, schedules),
    highlights: buildHighlights(rawTour, destinationContent),
    faqItems: buildFaqItems(rawTour),
    priceSummary: buildPriceSummary(schedules),
    bookingPreviewNote:
      'Departure selection, guest pricing, and next-step reservation details are kept consistent from discovery through checkout.',
  }
}
