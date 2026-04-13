import { env } from '@/app/config/env'
import type { Destination, DestinationRegion, DestinationQueryParams } from '@/features/destinations/model/destination.types'
import type { Promotion, PromotionCategory, PromotionQueryParams, PromotionStatus } from '@/features/promotions/model/promotion.types'
import type { FaqItem, HelpTopic } from '@/features/support/model/support.types'
import { mockAuth } from '@/shared/api/mockAuth'
import { mockAuthClient } from '@/shared/api/mockAuthClient'
import { mockDb } from '@/shared/api/mockData'
import {
  clearMockAuthSession,
  getMockSessionAccessToken,
  getStoredMockAuthState,
  persistMockAuthResponse,
} from '@/shared/api/mockSession'
import { resolveAfter } from '@/shared/api/resolveAfter'
import type { AdminDashboardSummary, Booking, Document, NotificationItemResponse, NotificationListResponse, Payment, Refund, SupportTicket, SupportTicketDetail, Tour, User } from '@/shared/types/api'
import type {
  Booking as MockBooking,
  DocumentRecord,
  NotificationRecord,
  PaymentMethod,
  PaymentRecord,
  RefundRecord,
  SupportTicket as MockSupportTicket,
  Tour as MockTour,
  TourSchedule,
  Voucher,
} from '@/shared/types/common'

type MockState = {
  destinations: typeof mockDb.destinations
  tours: typeof mockDb.tours
  tourSchedules: typeof mockDb.tourSchedules
  bookings: typeof mockDb.bookings
  payments: typeof mockDb.payments
  documents: typeof mockDb.documents
  refunds: typeof mockDb.refunds
  supportTickets: typeof mockDb.supportTickets
  notifications: typeof mockDb.notifications
  vouchers: typeof mockDb.vouchers
  pricingRules: typeof mockDb.pricingRules
}

type AdminTourMeta = {
  code: string
  status: 'active' | 'inactive'
  meetingPoint?: string
  tourType?: string
  durationNights?: number
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createInitialState(): MockState {
  const state = {
    destinations: cloneValue(mockDb.destinations),
    tours: cloneValue(mockDb.tours),
    tourSchedules: cloneValue(mockDb.tourSchedules),
    bookings: cloneValue(mockDb.bookings),
    payments: cloneValue(mockDb.payments),
    documents: cloneValue(mockDb.documents),
    refunds: cloneValue(mockDb.refunds),
    supportTickets: cloneValue(mockDb.supportTickets),
    notifications: cloneValue(mockDb.notifications),
    vouchers: cloneValue(mockDb.vouchers),
    pricingRules: cloneValue(mockDb.pricingRules),
  }

  const refundablePayment = state.payments.find((payment) => payment.bookingId === 'booking-2')
  if (refundablePayment) {
    refundablePayment.status = 'success'
  }

  return state
}

const mockState = createInitialState()
const adminTourMeta = new Map<string, AdminTourMeta>(
  mockState.tours.map((tour) => [
    tour.id,
    {
      code: `TB_${tour.slug.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`,
      status: 'active',
      meetingPoint: `${tour.location.split(',')[0]?.trim() ?? tour.location} arrival point`,
      tourType: 'Curated itinerary',
      durationNights: Math.max(tour.durationDays - 1, 0),
    },
  ]),
)

const helpTopics: HelpTopic[] = [
  {
    id: 'trip-support',
    title: 'Trip support',
    description: 'Route changes, pickup times, vouchers, and departure coordination.',
    iconKey: 'ticket',
    bullets: ['Pickup windows', 'Voucher access', 'Last-minute route notes'],
    ctaLabel: 'Open a support request',
    searchTerms: ['trip', 'pickup', 'voucher', 'departure'],
  },
  {
    id: 'refund',
    title: 'Refunds',
    description: 'Track review, payout timing, and refund exceptions.',
    iconKey: 'refund',
    bullets: ['Refund review', 'Payout timing', 'Cancellation policy'],
    ctaLabel: 'Request a refund',
    searchTerms: ['refund', 'cancel', 'payout'],
  },
]

const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    topicId: 'trip-support',
    categoryTitle: 'Trip support',
    categoryIconKey: 'ticket',
    question: 'Where can I find my latest departure notes?',
    answer: 'Open the booking or support thread and the latest operator update will appear there.',
  },
  {
    id: 'faq-2',
    topicId: 'refund',
    categoryTitle: 'Refunds',
    categoryIconKey: 'refund',
    question: 'How long do refunds take?',
    answer: 'Mock payouts settle after review so the account shell can demonstrate the full workflow.',
  },
]

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  return `${prefix}-${suffix}`
}

function paginate<T>(items: T[], limit: number, offset: number) {
  return items.slice(offset, offset + limit)
}

function buildReference(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`
}

function inferDestinationRegion(country: string): DestinationRegion {
  const normalizedCountry = country.toLowerCase()

  if (['italy', 'greece', 'spain', 'portugal'].includes(normalizedCountry)) {
    return 'mediterranean'
  }

  if (['switzerland', 'norway', 'iceland', 'japan', 'vietnam'].includes(normalizedCountry)) {
    return normalizedCountry === 'japan' || normalizedCountry === 'vietnam'
      ? 'asia-pacific'
      : 'northern-europe'
  }

  return 'asia-pacific'
}

function getCurrentUserOrNull() {
  try {
    return mockAuth.requireAccessUser(getMockSessionAccessToken())
  } catch {
    return null
  }
}

function requireCurrentUser() {
  const user = getCurrentUserOrNull()

  if (!user) {
    throw new Error('Mock session is invalid or has expired.')
  }

  return user
}

function buildApiUser(user: User): User {
  return {
    ...user,
    full_name: user.full_name ?? user.name,
    roles: user.roles?.length ? user.roles : [user.role ?? 'traveler'],
    permissions: user.permissions ?? [],
    created_at: user.created_at ?? nowIso(),
    updated_at: user.updated_at ?? nowIso(),
  }
}

function toFeatureDestination(destination: MockState['destinations'][number]): Destination {
  const featuredTour = mockState.tours.find((tour) => destination.featuredTourIds.includes(tour.id))

  return {
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    region: inferDestinationRegion(destination.country),
    eyebrow: destination.headline,
    summary: destination.summary,
    description: destination.headline,
    imageUrl: destination.image,
    imageAlt: `${destination.name} destination artwork`,
    bestTimeLabel: 'Best from April to October',
    signatureLabel: destination.bestFor,
    featured: true,
    tourSearchValue: featuredTour?.slug ?? destination.slug,
    tourCount: destination.featuredTourIds.length,
    startingPrice: featuredTour?.priceFrom ?? null,
    currency: 'USD',
  }
}

function toFeaturePromotion(
  promotion: MockState['pricingRules'][number] | typeof mockDb.promotions[number],
  index: number,
): Promotion {
  const isRule = 'scope' in promotion
  const id = isRule ? promotion.id : promotion.id
  const title = isRule ? promotion.name : promotion.title
  const description = isRule
    ? `${promotion.value} applied to ${promotion.scope}.`
    : promotion.summary
  const category = (isRule ? 'seasonal' : index % 2 === 0 ? 'seasonal' : 'group_escape') as PromotionCategory
  const status = (index % 3 === 0 ? 'active' : index % 3 === 1 ? 'limited' : 'active') as PromotionStatus
  const imageUrl = isRule ? '/images/hero-banner.jpg' : promotion.image

  return {
    id,
    category,
    status,
    eyebrow: isRule ? 'Pricing update' : promotion.discountLabel,
    badge: isRule ? promotion.value : promotion.code,
    title,
    offerSummary: isRule ? promotion.scope : promotion.summary,
    description,
    applicableLabel: isRule ? promotion.scope : `Use code ${promotion.code}`,
    imageUrl,
    imageAlt: `${title} promotion artwork`,
    validFrom: '2026-01-01',
    validUntil: isRule ? undefined : promotion.validUntil,
    featured: index === 0,
    primaryCta: {
      label: 'Browse tours',
      href: '/tours',
      kind: 'tours',
    },
    secondaryCta: {
      label: 'Review booking',
      href: '/checkout',
      kind: 'booking',
    },
  }
}

function buildTourPriceRules(schedule: TourSchedule) {
  return [
    {
      id: `${schedule.id}-adult`,
      traveler_type: 'ADULT',
      price: schedule.price,
      currency: 'USD',
    },
    {
      id: `${schedule.id}-child`,
      traveler_type: 'CHILD',
      price: Math.round(schedule.price * 0.75),
      currency: 'USD',
    },
    {
      id: `${schedule.id}-infant`,
      traveler_type: 'INFANT',
      price: Math.round(schedule.price * 0.2),
      currency: 'USD',
    },
  ]
}

function toApiTour(tour: MockTour): Tour {
  const metadata = adminTourMeta.get(tour.id)
  const schedules = mockState.tourSchedules
    .filter((schedule) => schedule.tourId === tour.id)
    .map((schedule) => ({
      id: schedule.id,
      departure_date: schedule.startDate,
      return_date: schedule.endDate,
      capacity: Math.max(schedule.seatsLeft + 6, 8),
      available_slots: schedule.seatsLeft,
      status: schedule.status.toUpperCase(),
      price_rules: buildTourPriceRules(schedule),
    }))

  return {
    id: tour.slug,
    code: metadata?.code,
    name: tour.title,
    destination: tour.location,
    description: tour.overview.join('\n\n') || tour.summary,
    duration_days: tour.durationDays,
    duration_nights: metadata?.durationNights ?? Math.max(tour.durationDays - 1, 0),
    meeting_point: metadata?.meetingPoint,
    tour_type: metadata?.tourType,
    status: metadata?.status?.toUpperCase() ?? 'ACTIVE',
    price: tour.priceFrom,
    available_slots: schedules[0]?.available_slots,
    start_date: schedules[0]?.departure_date,
    end_date: schedules[0]?.return_date,
    activities: tour.highlights,
    created_at: nowIso(),
    schedules,
    itineraries: tour.itinerary.map((item) => ({
      id: `${tour.id}-day-${item.day}`,
      day_number: item.day,
      title: item.title,
      description: item.description,
    })),
    policies: [
      {
        id: `${tour.id}-policy`,
        cancellation_policy: 'Free cancellation up to 7 days before departure.',
        refund_policy: 'Processed to the original payment source.',
        notes: 'Mock policy for shell verification.',
      },
    ],
  }
}

function buildBookingPaymentStatus(bookingId: string) {
  const payment = mockState.payments.find((item) => item.bookingId === bookingId)

  if (!payment) {
    return 'PENDING'
  }

  if (payment.status === 'success') {
    return 'PAID'
  }

  if (payment.status === 'failed') {
    return 'FAILED'
  }

  return payment.status.toUpperCase()
}

function toApiBooking(booking: MockBooking): Booking {
  return {
    id: booking.id,
    user_id: requireCurrentUser().id,
    booking_code: booking.reference,
    booking_type: 'TOUR',
    status: booking.status.toUpperCase(),
    tour_id: booking.tourId,
    schedule_id: booking.scheduleId,
    booking_status: booking.status.toUpperCase(),
    total_base_amount: booking.total,
    total_discount_amount: 0,
    total_final_amount: booking.total,
    total_price: booking.total,
    currency: booking.currency ?? 'USD',
    booking_date: booking.createdAt,
    travel_date:
      mockState.tourSchedules.find((schedule) => schedule.id === booking.scheduleId)?.startDate ??
      booking.createdAt,
    number_of_travelers: Math.max(booking.travelerIds.length, 1),
    payment_status: buildBookingPaymentStatus(booking.id),
    booked_at: booking.createdAt,
    created_at: booking.createdAt,
    updated_at: booking.createdAt,
  }
}

function toApiPayment(payment: PaymentRecord): Payment {
  const method = mockDb.paymentMethods.find((item) => item.id === payment.methodId)
  const paymentStatus =
    payment.status === 'success'
      ? 'PAID'
      : payment.status === 'failed'
        ? 'FAILED'
        : payment.status === 'processing'
          ? 'AUTHORIZED'
          : 'PENDING'

  return {
    id: payment.id,
    booking_id: payment.bookingId,
    amount: payment.amount,
    currency: 'USD',
    status: paymentStatus,
    payment_status: paymentStatus,
    payment_method: method?.id ?? payment.methodId,
    transaction_id: payment.status === 'success' ? `${payment.id}-txn` : undefined,
    paid_at: payment.status === 'success' ? nowIso() : undefined,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
}

function toApiDocument(document: DocumentRecord): Document {
  return {
    id: document.id,
    user_id: requireCurrentUser().id,
    booking_id: document.bookingId,
    document_type: document.type.replace(/\s+/g, '_').toUpperCase(),
    file_url: '#',
    file_name: document.title,
    original_filename: document.title,
    mime_type: 'application/pdf',
    upload_date: document.uploadedAt,
    uploaded_at: document.uploadedAt,
    status:
      document.status === 'verified'
        ? 'APPROVED'
        : document.status === 'rejected'
          ? 'REJECTED'
          : 'PENDING',
  }
}

function toApiRefund(refund: RefundRecord): Refund {
  return {
    id: refund.id,
    booking_id: refund.bookingId,
    amount: refund.amount,
    currency: refund.currency ?? 'USD',
    status:
      refund.status === 'review'
        ? 'PENDING'
        : refund.status === 'approved'
          ? 'PROCESSED'
          : refund.status.toUpperCase(),
    reason: refund.reason,
    created_at: refund.createdAt,
    updated_at: refund.timeline.at(-1)?.date ?? refund.createdAt,
    timeline: refund.timeline.map((item) => ({
      label: item.label,
      date: item.date,
      status: item.status,
    })),
  }
}

function toApiSupportTicket(ticket: MockSupportTicket): SupportTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    topic_id: ticket.topicId ?? 'trip-support',
    subject: ticket.subject,
    requester_name: ticket.fullName ?? requireCurrentUser().name,
    requester_email: ticket.email ?? requireCurrentUser().email,
    booking_reference: ticket.bookingReference,
    status: ticket.status,
    message_preview: ticket.messages.at(-1)?.body ?? ticket.subject,
    created_at: ticket.messages[0]?.timestamp ?? ticket.updatedAt,
    updated_at: ticket.updatedAt,
  }
}

function toApiSupportTicketDetail(ticket: MockSupportTicket): SupportTicketDetail {
  const [firstMessage, ...replies] = ticket.messages

  return {
    ...toApiSupportTicket(ticket),
    message: firstMessage?.body ?? '',
    replies: replies.map((message, index) => ({
      id: `${ticket.id}-reply-${index + 1}`,
      author_name: message.from === 'agent' ? 'Operations Agent' : ticket.fullName ?? requireCurrentUser().name,
      author_role: message.from === 'agent' ? 'support' : 'traveler',
      message: message.body,
      created_at: message.timestamp,
    })),
  }
}

function toApiNotification(notification: NotificationRecord): NotificationItemResponse {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    created_at: notification.createdAt,
    read: notification.read,
  }
}

function buildDashboardSummary(): AdminDashboardSummary {
  const bookingCounts = new Map<string, number>()
  const paymentCounts = new Map<string, number>()
  const refundCounts = new Map<string, number>()

  for (const booking of mockState.bookings) {
    bookingCounts.set(booking.status, (bookingCounts.get(booking.status) ?? 0) + 1)
  }

  for (const payment of mockState.payments) {
    paymentCounts.set(payment.status, (paymentCounts.get(payment.status) ?? 0) + 1)
  }

  for (const refund of mockState.refunds) {
    refundCounts.set(refund.status, (refundCounts.get(refund.status) ?? 0) + 1)
  }

  const paidAmount = mockState.payments
    .filter((payment) => payment.status === 'success')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const refundedAmount = mockState.refunds
    .filter((refund) => refund.status === 'paid' || refund.status === 'approved')
    .reduce((sum, refund) => sum + refund.amount, 0)

  const recentActivities = [
    ...mockState.supportTickets.map((ticket) => ({
      audit_log_id: `${ticket.id}-activity`,
      actor_type: 'user',
      actor_user_id: null,
      action: 'support_ticket_updated',
      resource_type: 'support_ticket',
      resource_id: ticket.id,
      created_at: ticket.updatedAt,
    })),
    ...mockState.documents.map((document) => ({
      audit_log_id: `${document.id}-activity`,
      actor_type: 'system',
      actor_user_id: null,
      action: `document_${document.status}`,
      resource_type: 'document',
      resource_id: document.id,
      created_at: document.uploadedAt,
    })),
  ]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 12)

  return {
    booking_status_counts: Array.from(bookingCounts, ([status, count]) => ({ status, count })),
    payment_status_counts: Array.from(paymentCounts, ([status, count]) => ({ status, count })),
    refund_status_counts: Array.from(refundCounts, ([status, count]) => ({ status, count })),
    revenue: {
      total_paid_amount: paidAmount,
      total_refunded_amount: refundedAmount,
      net_revenue_amount: paidAmount - refundedAmount,
      currency: 'USD',
    },
    recent_activities: recentActivities,
  }
}

function ensureMockModeEnabled() {
  if (!env.enableMocks) {
    throw new Error('Mock API is disabled.')
  }
}

export function createMockApiClient() {
  ensureMockModeEnabled()

  return {
    async login(email: string, password: string) {
      const response = await mockAuthClient.login(email, password)
      persistMockAuthResponse(response)
      return resolveAfter({
        ...response,
        user: buildApiUser(response.user ?? mockAuth.getUserByEmail(email) ?? requireCurrentUser()),
      })
    },

    async register(email: string, password: string, name: string) {
      return mockAuthClient.register(email, password, name)
    },

    async refreshToken() {
      return mockAuthClient.refreshToken({
        getState: () => getStoredMockAuthState(),
        setState: (_nextState) => {
          void _nextState
        },
      })
    },

    async restoreSession() {
      const user = getCurrentUserOrNull()
      return resolveAfter(user ? buildApiUser(user) : null)
    },

    async getMe() {
      return resolveAfter(buildApiUser(requireCurrentUser()))
    },

    async updateMe(payload: { full_name: string }) {
      const user = await mockAuthClient.updateMe(payload, getMockSessionAccessToken())
      return resolveAfter(buildApiUser(user))
    },

    async logout() {
      clearMockAuthSession()
      return resolveAfter(undefined)
    },

    async logoutAll() {
      clearMockAuthSession()
      return resolveAfter(undefined)
    },

    async changeMyPassword() {
      return resolveAfter(undefined)
    },

    async forgotPassword(email: string) {
      return resolveAfter({ email })
    },

    async resetPassword() {
      return resolveAfter(true)
    },

    async verifyEmail() {
      return resolveAfter(true)
    },

    async getDestinations(params: DestinationQueryParams = {}) {
      let items = mockState.destinations.map(toFeatureDestination)

      if (params.region) {
        items = items.filter((item) => item.region === params.region)
      }

      if (params.query) {
        const query = params.query.trim().toLowerCase()
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.country.toLowerCase().includes(query) ||
            item.tourSearchValue.toLowerCase().includes(query),
        )
      }

      if (params.featuredOnly) {
        items = items.filter((item) => item.featured)
      }

      return resolveAfter(items.slice(0, params.limit ?? items.length))
    },

    async getPromotions(params: PromotionQueryParams = {}) {
      let items = [...mockDb.promotions, ...mockState.pricingRules].map(toFeaturePromotion)

      if (params.category) {
        items = items.filter((item) => item.category === params.category)
      }

      if (params.status) {
        items = items.filter((item) => item.status === params.status)
      }

      if (params.featuredOnly) {
        items = items.filter((item) => item.featured)
      }

      return resolveAfter(items.slice(0, params.limit ?? items.length))
    },

    async getSupportFaqs() {
      return resolveAfter(faqs)
    },

    async getSupportHelpTopics() {
      return resolveAfter(helpTopics)
    },

    async searchTours(params: { destination?: string; limit?: number; offset?: number }) {
      let tours = mockState.tours

      if (params.destination?.trim()) {
        const destination = params.destination.trim().toLowerCase()
        tours = tours.filter(
          (tour) =>
            tour.title.toLowerCase().includes(destination) ||
            tour.location.toLowerCase().includes(destination) ||
            tour.slug.toLowerCase().includes(destination),
        )
      }

      const offset = params.offset ?? 0
      const limit = params.limit ?? 12

      return resolveAfter({
        tours: paginate(tours, limit, offset).map(toApiTour),
        total: tours.length,
        limit,
        offset,
      })
    },

    async getTourById(id: string) {
      const tour =
        mockState.tours.find((item) => item.id === id || item.slug === id) ??
        mockState.tours[0]

      return resolveAfter(toApiTour(tour))
    },

    async getUserBookings(limit = 10, offset = 0) {
      return resolveAfter({
        bookings: paginate(mockState.bookings, limit, offset).map(toApiBooking),
        total: mockState.bookings.length,
      })
    },

    async getBooking(id: string) {
      const booking = mockState.bookings.find((item) => item.id === id)

      if (!booking) {
        throw new Error('Booking not found.')
      }

      return resolveAfter({ booking: toApiBooking(booking) })
    },

    async getBookingTravelers(bookingId: string) {
      const booking = mockState.bookings.find((item) => item.id === bookingId)
      const user = requireCurrentUser()

      return resolveAfter(
        (booking?.travelerIds ?? ['traveler-1']).map((travelerId, index) => ({
          id: travelerId,
          booking_id: bookingId,
          full_name: index === 0 ? user.name : 'Companion Traveler',
          traveler_type: index === 0 ? 'ADULT' : 'CHILD',
          nationality: 'Swiss',
          document_type: 'PASSPORT',
          is_primary: index === 0,
        })),
      )
    },

    async getMyTravelers() {
      return resolveAfter([
        {
          id: 'traveler-1',
          booking_id: mockState.bookings[0]?.id ?? 'booking-1',
          booking_code: mockState.bookings[0]?.reference ?? 'BK-9021',
          full_name: requireCurrentUser().name,
          traveler_type: 'ADULT',
          date_of_birth: '1991-04-10',
          passport_number: 'XK129320',
          nationality: 'Swiss',
          document_type: 'PASSPORT',
          is_primary: true,
        },
      ])
    },

    async getMyVoucherSummaries() {
      return resolveAfter(
        mockState.vouchers.map((voucher: Voucher) => ({
          booking_id: voucher.bookingId,
          booking_code:
            mockState.bookings.find((booking) => booking.id === voucher.bookingId)?.reference ??
            voucher.bookingId,
          issued_at: voucher.issuedAt,
        })),
      )
    },

    async getAvailablePaymentMethods() {
      const methods: PaymentMethod[] = [
        {
          id: 'stripe',
          type: 'card',
          title: 'Card via Stripe',
          description: 'Visa, Mastercard, and other supported cards through Stripe.',
          icon: 'credit_card',
        },
        {
          id: 'manual',
          type: 'bank',
          title: 'Manual Settlement',
          description: 'Reserve now and settle with operations later.',
          icon: 'account_balance',
        },
      ]

      return resolveAfter(methods)
    },

    async createTourCheckout(data: {
      schedule_id: string
      adult_count: number
      child_count: number
      infant_count: number
      payment_method: string
      idempotency_key: string
    }) {
      const schedule = mockState.tourSchedules.find((item) => item.id === data.schedule_id)
      const tour = mockState.tours.find((item) => item.id === schedule?.tourId)

      if (!schedule || !tour) {
        throw new Error('Selected schedule is unavailable.')
      }

      const travelerCount = Math.max(
        data.adult_count + data.child_count + data.infant_count,
        1,
      )
      const totalAmount = schedule.price * travelerCount
      const bookingId = createId('booking')
      const paymentId = createId('payment')
      const createdAt = nowIso()
      const isSelfServiceMethod = data.payment_method !== 'manual'

      const booking: MockBooking = {
        id: bookingId,
        reference: buildReference('BK'),
        tourId: tour.id,
        scheduleId: schedule.id,
        travelerIds: Array.from({ length: travelerCount }, (_, index) => `traveler-${index + 1}`),
        status: isSelfServiceMethod ? 'confirmed' : 'processing',
        paymentStatus: isSelfServiceMethod ? 'paid' : 'pending',
        total: totalAmount,
        currency: 'USD',
        createdAt,
        notes: `Created from mock checkout (${data.idempotency_key}).`,
      }
      const payment: PaymentRecord = {
        id: paymentId,
        bookingId,
        methodId: data.payment_method,
        amount: totalAmount,
        status: isSelfServiceMethod ? 'success' : 'processing',
      }

      mockState.bookings.unshift(booking)
      mockState.payments.unshift(payment)
      mockState.notifications.unshift({
        id: createId('notification'),
        title: isSelfServiceMethod ? 'Payment successful' : 'Payment request created',
        body: `Booking ${booking.reference} is now tracked in your account.`,
        type: 'booking',
        createdAt,
        read: false,
      })

      return resolveAfter({
        booking: toApiBooking(booking),
        payment: toApiPayment(payment),
      })
    },

    async getPayment(id: string) {
      const payment = mockState.payments.find((item) => item.id === id)

      if (!payment) {
        throw new Error('Payment not found.')
      }

      return resolveAfter(toApiPayment(payment))
    },

    async getUserRefunds(limit = 20, offset = 0) {
      return resolveAfter({
        refunds: paginate(mockState.refunds, limit, offset).map(toApiRefund),
        total: mockState.refunds.length,
      })
    },

    async getRefund(id: string) {
      const refund = mockState.refunds.find((item) => item.id === id)

      if (!refund) {
        throw new Error('Refund not found.')
      }

      return resolveAfter(toApiRefund(refund))
    },

    async createRefundRequest(payload: { booking_id?: string; reason: string }) {
      const refund: RefundRecord = {
        id: createId('refund'),
        bookingId: payload.booking_id ?? mockState.bookings[0]?.id ?? 'booking-1',
        amount: 320,
        currency: 'USD',
        status: 'review',
        reason: payload.reason,
        createdAt: nowIso(),
        timeline: [
          { label: 'Request created', date: nowIso(), status: 'complete' },
          { label: 'Operations review', date: nowIso(), status: 'current' },
        ],
      }

      mockState.refunds.unshift(refund)
      return resolveAfter(toApiRefund(refund))
    },

    async getSupportTickets(limit = 20, offset = 0) {
      return resolveAfter({
        tickets: paginate(mockState.supportTickets, limit, offset).map(toApiSupportTicket),
        total: mockState.supportTickets.length,
      })
    },

    async getSupportTicket(id: string) {
      const ticket = mockState.supportTickets.find((item) => item.id === id)

      if (!ticket) {
        throw new Error('Support ticket not found.')
      }

      return resolveAfter(toApiSupportTicketDetail(ticket))
    },

    async replyToSupportTicket(
      id: string,
      payload: { message: string; status?: string },
    ) {
      const ticket = mockState.supportTickets.find((item) => item.id === id)

      if (!ticket) {
        throw new Error('Support ticket not found.')
      }

      ticket.messages.push({
        from: 'user',
        body: payload.message,
        timestamp: nowIso(),
      })
      ticket.updatedAt = nowIso()
      return resolveAfter(toApiSupportTicketDetail(ticket))
    },

    async createSupportTicket(payload: {
      full_name: string
      email: string
      topic_id: string
      subject: string
      message: string
      booking_reference?: string
    }) {
      const ticket: MockSupportTicket = {
        id: createId('ticket'),
        reference: buildReference('SR'),
        subject: payload.subject,
        fullName: payload.full_name,
        email: payload.email,
        topicId: payload.topic_id,
        bookingReference: payload.booking_reference,
        status: 'open',
        updatedAt: nowIso(),
        messages: [
          {
            from: 'user',
            body: payload.message,
            timestamp: nowIso(),
          },
        ],
      }

      mockState.supportTickets.unshift(ticket)
      return resolveAfter(toApiSupportTicket(ticket))
    },

    async getAdminSupportTickets(limit = 20, offset = 0, status?: string) {
      const filteredTickets = status
        ? mockState.supportTickets.filter((ticket) => ticket.status === status)
        : mockState.supportTickets

      return resolveAfter({
        tickets: paginate(filteredTickets, limit, offset).map(toApiSupportTicket),
        total: filteredTickets.length,
      })
    },

    async getAdminSupportTicket(id: string) {
      return this.getSupportTicket(id)
    },

    async replyToAdminSupportTicket(
      id: string,
      payload: { message: string; status?: string },
    ) {
      const ticket = mockState.supportTickets.find((item) => item.id === id)

      if (!ticket) {
        throw new Error('Support ticket not found.')
      }

      ticket.messages.push({
        from: 'agent',
        body: payload.message,
        timestamp: nowIso(),
      })
      if (payload.status) {
        ticket.status = payload.status as MockSupportTicket['status']
      }
      ticket.updatedAt = nowIso()
      return resolveAfter(toApiSupportTicketDetail(ticket))
    },

    async updateAdminSupportTicket(id: string, payload: { status: string }) {
      const ticket = mockState.supportTickets.find((item) => item.id === id)

      if (!ticket) {
        throw new Error('Support ticket not found.')
      }

      ticket.status = payload.status as MockSupportTicket['status']
      ticket.updatedAt = nowIso()
      return resolveAfter(toApiSupportTicketDetail(ticket))
    },

    async uploadDocument(documentType: string, file: File) {
      const document: DocumentRecord = {
        id: createId('document'),
        bookingId: mockState.bookings[0]?.id ?? 'booking-1',
        title: file.name,
        type: documentType.trim() || 'invoice',
        uploadedAt: nowIso(),
        status: 'pending',
        notes: 'Uploaded in mock mode.',
      }

      mockState.documents.unshift(document)
      return resolveAfter(toApiDocument(document))
    },

    async getUserDocuments() {
      return resolveAfter(mockState.documents.map(toApiDocument))
    },

    async getNotifications(): Promise<NotificationListResponse> {
      return resolveAfter({
        items: mockState.notifications.map(toApiNotification),
      })
    },

    async markNotificationRead(notificationId: string) {
      const notification = mockState.notifications.find((item) => item.id === notificationId)

      if (!notification) {
        throw new Error('Notification not found.')
      }

      notification.read = true
      return resolveAfter(toApiNotification(notification))
    },

    async markAllNotificationsRead(): Promise<NotificationListResponse> {
      for (const notification of mockState.notifications) {
        notification.read = true
      }

      return resolveAfter({
        items: mockState.notifications.map(toApiNotification),
      })
    },

    async getAdminDashboardSummary(recentLimit = 10) {
      const summary = buildDashboardSummary()
      return resolveAfter({
        ...summary,
        recent_activities: summary.recent_activities.slice(0, recentLimit),
      })
    },

    async getAllBookings(limit = 10, offset = 0) {
      return resolveAfter({
        bookings: paginate(mockState.bookings, limit, offset).map((booking) => ({
          ...toApiBooking(booking),
          user_id: booking.id.startsWith('booking-') ? 'user-1' : requireCurrentUser().id,
        })),
        total: mockState.bookings.length,
      })
    },

    async getAdminDocuments(limit = 20, offset = 0) {
      return resolveAfter({
        documents: paginate(mockState.documents, limit, offset).map(toApiDocument),
        total: mockState.documents.length,
      })
    },

    async reviewAdminDocument(
      documentId: string,
      status: 'approved' | 'rejected' = 'approved',
    ) {
      const document = mockState.documents.find((item) => item.id === documentId)

      if (!document) {
        throw new Error('Document not found.')
      }

      document.status = status === 'approved' ? 'verified' : 'rejected'
      return resolveAfter(toApiDocument(document))
    },

    async getAdminTours(limit = 50, offset = 0) {
      return resolveAfter({
        tours: paginate(mockState.tours, limit, offset).map(toApiTour),
        total: mockState.tours.length,
      })
    },

    async createAdminTour(payload: {
      code: string
      name: string
      destination: string
      description?: string
      duration_days: number
      duration_nights: number
      meeting_point?: string
      tour_type?: string
      status: 'active' | 'inactive'
    }) {
      const id = createId('tour')
      const slug = payload.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const tour: MockTour = {
        id,
        slug,
        title: payload.name,
        location: payload.destination,
        destinationId: 'dest-amalfi',
        summary: payload.description ?? payload.name,
        overview: [payload.description ?? payload.name],
        highlights: ['Live mock validation'],
        itinerary: [{ day: 1, title: 'Arrival', description: 'Mock itinerary preview.' }],
        durationDays: payload.duration_days,
        groupSize: 12,
        activityLevel: 'Moderate',
        availability: payload.status,
        priceFrom: 1299,
        heroImage: '/images/hero-banner.jpg',
        cardImage: '/images/hero-banner.jpg',
        gallery: [],
        badge: 'Draft',
        operator: 'TravelBook Mock Ops',
        instantConfirmation: true,
      }

      mockState.tours.unshift(tour)
      adminTourMeta.set(id, {
        code: payload.code,
        status: payload.status,
        meetingPoint: payload.meeting_point,
        tourType: payload.tour_type,
        durationNights: payload.duration_nights,
      })

      return resolveAfter(toApiTour(tour))
    },

    async updateAdminTour(
      tourId: string,
      payload: {
        name?: string
        destination?: string
        description?: string
        duration_days?: number
        duration_nights?: number
        meeting_point?: string
        tour_type?: string
        status?: 'active' | 'inactive'
      },
    ) {
      const tour = mockState.tours.find((item) => item.id === tourId || item.slug === tourId)

      if (!tour) {
        throw new Error('Tour not found.')
      }

      if (payload.name) {
        tour.title = payload.name
      }
      if (payload.destination) {
        tour.location = payload.destination
      }
      if (payload.description) {
        tour.summary = payload.description
        tour.overview = [payload.description]
      }
      if (typeof payload.duration_days === 'number') {
        tour.durationDays = payload.duration_days
      }

      const currentMeta = adminTourMeta.get(tour.id) ?? {
        code: `TB_${tour.slug.toUpperCase()}`,
        status: 'active' as const,
      }
      adminTourMeta.set(tour.id, {
        code: currentMeta.code,
        status: payload.status ?? currentMeta.status,
        meetingPoint: payload.meeting_point ?? currentMeta.meetingPoint,
        tourType: payload.tour_type ?? currentMeta.tourType,
        durationNights: payload.duration_nights ?? currentMeta.durationNights,
      })

      return resolveAfter(toApiTour(tour))
    },
  }
}
