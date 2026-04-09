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

interface TourVisualPreset {
  heroImageUrl: string
  heroImageAlt: string
  highlights: DestinationHighlight[]
}

const TOUR_VISUAL_PRESETS: Record<string, TourVisualPreset> = {
  'amalfi-coast-sailing': {
    heroImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYr6UoUXza-Rxyx5gz2FLRC6AGpbtwDLzsvIoUfoMgJydSQjyYo5CKHlUeq0AsXMK59_6pWj_RSVJXG3ecpSThDTy3R705lliyFIr9AQsx-peQ4TYWoEJLP185pw67VX3TdHN_X5eD1fj8XWWQMogzGH_CloEjV1cGmWmej-gY_zfWeIPQlf6CblQmwuY_sqdJFUCiwaQ4A7qpcgaitFHNSLS4Z8sF8NnwZJHKKL7MvRwiqtRgPVucxtjnz0Sf5yxBXdhQ5LAW4nG7',
    heroImageAlt:
      'Sun-drenched Amalfi Coast village with colorful homes set against dramatic cliffs and a sparkling blue sea.',
    highlights: [
      {
        title: 'Hidden Grottos',
        description:
          'Discover sea caves and sheltered coves where the water turns glassy turquoise by midday.',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAIGEBAMkwSFNVJM8exTWciRHLCHux9DxCRXCsXOs2rMM0qQ-DiMLopXzrhPpwzoO16ZhZKP9g3_OtT0xfmlGCLbZx9XwGk4JIymC5Yp4ilEuj2KsSz7tCAZYp1XoU84WNukOCTKENwkBu-FokbRdHE9VyUKJj7LIqN_bwjkNCnGjpTSq2-FfBDj2ufokj-CWVBTy8jq08y6EbI6yBhFgjFE8DDExSDwJ3pP0k9u64UzoWar8o7wsiMZtck-EnAzOOIS40HL4S-5XH_',
        imageAlt:
          'Tall coastal cliffs over the Mediterranean with a sailboat near rock formations off Capri.',
      },
      {
        title: 'Hillside Gardens',
        description:
          'Wander elevated terraces and villa gardens where the coastline opens into quiet panoramic viewpoints.',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ8LeHi_jO-2D_hC0lpQepSFF0lyYMiSjvjiuAGFpEXYx3vYNNKtPmJec-adYonRLn15nR1Ug3wFJl9lvc1cTb42cHHp2u0sX21Zrd8rd9ijQR0LjBK7rUNQ7E8CNvXteq3jpbGCJyvxQy0rh5Et88qsLnFYBL0MXmbepGnpDuMNXrHTFrD8e_6rWTr-TFklYmQFTqUY_Z2d-0bxAe_yEVx7g_VmY_mHsHrgqonKGcAtUYEfZ_Znk4EUtiFeIWD5VFKJlhn0P8y887',
        imageAlt:
          'Flower-framed stone terrace in Ravello overlooking the Amalfi Coast and sea below.',
      },
    ],
  },
  'kyoto-temple-trail': {
    heroImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
    heroImageAlt: 'Temple rooftops in Kyoto framed by misty mountains and pine forests.',
    highlights: [
      {
        title: 'Temple Districts',
        description:
          'Move through quiet lanes and protected heritage zones with room for slow, reflective discovery.',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
        imageAlt: 'Traditional Kyoto temple complex set against layered green hills.',
      },
      {
        title: 'Architectural Calm',
        description:
          'Designed for travelers who want history, quiet ritual, and beautifully structured pacing.',
        imageUrl:
          'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Japanese temple corridor with warm wood tones and soft natural light.',
      },
    ],
  },
}

const DEFAULT_VISUAL_PRESET: TourVisualPreset = {
  heroImageUrl:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
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

function buildVisualPreset(tour: ApiTour) {
  const directMatch = TOUR_VISUAL_PRESETS[tour.id]

  if (directMatch) {
    return directMatch
  }

  const keyword = `${tour.destination} ${tour.name}`.toLowerCase()

  if (keyword.includes('coast') || keyword.includes('sailing')) {
    return TOUR_VISUAL_PRESETS['amalfi-coast-sailing'] ?? DEFAULT_VISUAL_PRESET
  }

  if (keyword.includes('kyoto') || keyword.includes('temple')) {
    return TOUR_VISUAL_PRESETS['kyoto-temple-trail'] ?? DEFAULT_VISUAL_PRESET
  }

  return DEFAULT_VISUAL_PRESET
}

function buildHighlights(tour: ApiTour) {
  const preset = buildVisualPreset(tour)

  if (preset.highlights.length > 0) {
    return preset.highlights
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

export function buildTourDetail(rawTour: ApiTour): TourDetail {
  const schedules = sortSchedules(rawTour.schedules ?? [])
  const visualPreset = buildVisualPreset(rawTour)

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
    heroImageUrl: visualPreset.heroImageUrl,
    heroImageAlt: visualPreset.heroImageAlt,
    heroBadges: [
      { label: 'Verified Tour', tone: 'verified' },
      { label: 'Instant Confirmation', tone: 'instant' },
    ],
    facts: buildFacts(rawTour, schedules),
    highlights: buildHighlights(rawTour),
    faqItems: buildFaqItems(rawTour),
    priceSummary: buildPriceSummary(schedules),
    bookingPreviewNote:
      'Departure selection, guest pricing, and next-step reservation details are kept consistent from discovery through checkout.',
  }
}
