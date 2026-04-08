import { env } from '@/app/config/env'
import { apiClient, resolveAfter } from '@/shared/api/apiClient'
import { bookings, supportTickets } from '@/shared/api/mockData'
import type {
  CreateSupportReplyPayload,
  SupportTicket as AppSupportTicket,
  SupportTicketDetail as AppSupportTicketDetail,
  CreateSupportTicketPayload,
  FaqItem,
  HelpTopic,
  UpdateSupportTicketStatusPayload,
} from '@/features/support/model/support.types'
import type {
  SupportTicket as ApiSupportTicket,
  SupportTicketDetail as ApiSupportTicketDetail,
} from '@/shared/types/api'
import type { SupportTicket as MockSupportTicket } from '@/shared/types/common'

const faqs: FaqItem[] = [
  {
    id: 'faq-bookings-1',
    topicId: 'bookings',
    categoryTitle: 'Bookings & schedules',
    categoryIconKey: 'calendar',
    question: 'How quickly will I receive my booking confirmation?',
    answer:
      'Most eligible departures are confirmed instantly after payment. If an operator needs a manual seat check, we usually update you within 12 hours.',
  },
  {
    id: 'faq-bookings-2',
    topicId: 'bookings',
    categoryTitle: 'Bookings & schedules',
    categoryIconKey: 'calendar',
    question: 'Can I change my travel dates after I book?',
    answer:
      'Date changes depend on the operator and fare conditions. Reach out as early as possible so the team can review alternate departures before fees increase.',
  },
  {
    id: 'faq-payments-1',
    topicId: 'payments',
    categoryTitle: 'Payments & security',
    categoryIconKey: 'wallet',
    question: 'Which payment methods can I use on TravelBook?',
    answer:
      'We support major cards, bank transfers for higher-value bookings, and TravelBook wallet credits where available at checkout.',
  },
  {
    id: 'faq-payments-2',
    topicId: 'payments',
    categoryTitle: 'Payments & security',
    categoryIconKey: 'wallet',
    question: 'Is my payment information stored securely?',
    answer:
      'Yes. Payment collection follows secure handling practices, and our support team will never ask you to send full card details over email or chat.',
  },
  {
    id: 'faq-refunds-1',
    topicId: 'refunds',
    categoryTitle: 'Refunds & changes',
    categoryIconKey: 'refund',
    question: 'How long does a refund review usually take?',
    answer:
      'Most refund requests move from review to final decision within 3 to 5 business days, depending on operator approval and payment provider timing.',
  },
  {
    id: 'faq-refunds-2',
    topicId: 'refunds',
    categoryTitle: 'Refunds & changes',
    categoryIconKey: 'refund',
    question: 'What if the operator changes my departure window?',
    answer:
      'If the operator makes a significant schedule change, we will outline your available rebooking or refund options and guide you through the next step.',
  },
  {
    id: 'faq-support-1',
    topicId: 'trip-support',
    categoryTitle: 'Trip support',
    categoryIconKey: 'ticket',
    question: 'When should I contact urgent traveler support?',
    answer:
      'Use urgent support for live trip issues such as same-day transfer problems, missed connections, or arrival coordination within 72 hours of departure.',
  },
  {
    id: 'faq-support-2',
    topicId: 'trip-support',
    categoryTitle: 'Trip support',
    categoryIconKey: 'ticket',
    question: 'How do I follow up on an existing support request?',
    answer:
      'Signed-in travelers can open their account support area to review ticket history, send replies, and keep every booking conversation in one place.',
  },
]

const topicDescriptions: Record<string, string> = {
  bookings: 'Confirmation windows, departure changes, and schedule clarity before you travel.',
  payments: 'Payment methods, secure checkout guidance, and billing-related questions.',
  refunds: 'Cancellation terms, refund review timing, and operator-led changes.',
  'trip-support': 'Urgent travel assistance and follow-up paths for active or upcoming bookings.',
}

const helpTopics: HelpTopic[] = [
  {
    id: 'bookings',
    title: 'Bookings & schedules',
    description: topicDescriptions.bookings,
    iconKey: 'calendar',
    bullets: ['Instant confirmation timing', 'Date change requests', 'Departure schedule questions'],
    searchTerms: ['booking', 'bookings', 'schedule', 'departure', 'change dates', 'confirmation'],
    ctaLabel: 'See booking answers',
  },
  {
    id: 'payments',
    title: 'Payments & security',
    description: topicDescriptions.payments,
    iconKey: 'wallet',
    bullets: ['Accepted payment methods', 'Secure checkout guidance', 'Billing and payment verification'],
    searchTerms: ['payment', 'payments', 'card', 'bank transfer', 'wallet', 'billing', 'security'],
    ctaLabel: 'See payment answers',
  },
  {
    id: 'refunds',
    title: 'Refunds & changes',
    description: topicDescriptions.refunds,
    iconKey: 'refund',
    bullets: ['Refund review timelines', 'Operator-led itinerary changes', 'Cancellation and rebooking options'],
    searchTerms: ['refund', 'refunds', 'cancel', 'cancellation', 'rebook', 'change booking'],
    ctaLabel: 'See refund answers',
  },
  {
    id: 'trip-support',
    title: 'Trip support',
    description: topicDescriptions['trip-support'],
    iconKey: 'ticket',
    bullets: ['Urgent departure assistance', 'Live travel coordination', 'Following up on open requests'],
    searchTerms: ['support', 'urgent', 'trip', 'traveler support', 'ticket', 'contact support'],
    ctaLabel: 'See support answers',
  },
]

export const supportApi = {
  getSupportTickets: async (): Promise<AppSupportTicket[]> => {
    if (env.enableMocks) {
      return resolveAfter(supportTickets.map(mapMockSupportTicket))
    }

    const response = await apiClient.getSupportTickets()
    return response.tickets.map(mapApiSupportTicket)
  },
  getSupportTicketDetail: async (id: string): Promise<AppSupportTicketDetail> => {
    if (env.enableMocks) {
      const ticket = supportTickets.find((item) => item.id === id)

      if (!ticket) {
        throw new Error('Support ticket not found.')
      }

      return resolveAfter(mapMockSupportTicketDetail(ticket))
    }

    const response = await apiClient.getSupportTicket(id)
    return mapApiSupportTicketDetail(response)
  },
  replyToSupportTicket: async (
    id: string,
    payload: CreateSupportReplyPayload,
  ): Promise<AppSupportTicketDetail> => {
    if (env.enableMocks) {
      const ticket = getMockSupportTicket(id)
      ticket.status = 'open'
      ticket.updatedAt = new Date().toISOString()
      ticket.messages.push({
        from: 'user',
        body: payload.message.trim(),
        timestamp: ticket.updatedAt,
      })
      return resolveAfter(mapMockSupportTicketDetail(ticket))
    }

    const response = await apiClient.replyToSupportTicket(id, {
      message: payload.message.trim(),
    })
    return mapApiSupportTicketDetail(response)
  },
  createSupportTicket: async (payload: CreateSupportTicketPayload): Promise<AppSupportTicket> => {
    const normalizedBookingReference = payload.bookingReference?.trim() ?? ''
    if (env.enableMocks) {
      const matchedBooking = bookings.find(
        (booking) => booking.reference.toLowerCase() === normalizedBookingReference.toLowerCase()
      )
      const createdTicket: MockSupportTicket = {
        id: `ticket-${supportTickets.length + 1}`,
        reference: `SR-${String(supportTickets.length + 1).padStart(4, '0')}`,
        subject: payload.subject.trim(),
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        topicId: payload.topicId.trim() || undefined,
        bookingReference: normalizedBookingReference || undefined,
        bookingId: matchedBooking?.id,
        status: 'open',
        updatedAt: new Date().toISOString(),
        messages: [{ from: 'user', body: payload.message.trim(), timestamp: new Date().toISOString() }],
      }

      supportTickets.unshift(createdTicket)
      return resolveAfter(mapMockSupportTicket(createdTicket))
    }

    const response = await apiClient.createSupportTicket({
      full_name: payload.fullName.trim(),
      email: payload.email.trim(),
      topic_id: payload.topicId.trim(),
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      booking_reference: normalizedBookingReference || undefined,
    })
    return mapApiSupportTicket(response)
  },
  getAdminSupportTickets: async (status?: string): Promise<AppSupportTicket[]> => {
    if (env.enableMocks) {
      const items = supportTickets
        .filter((ticket) => !status || normalizeSupportStatus(ticket.status) === status)
        .map(mapMockSupportTicket)
      return resolveAfter(items)
    }

    const response = await apiClient.getAdminSupportTickets(20, 0, status)
    return response.tickets.map(mapApiSupportTicket)
  },
  getAdminSupportTicketDetail: async (id: string): Promise<AppSupportTicketDetail> => {
    if (env.enableMocks) {
      return resolveAfter(mapMockSupportTicketDetail(getMockSupportTicket(id)))
    }

    const response = await apiClient.getAdminSupportTicket(id)
    return mapApiSupportTicketDetail(response)
  },
  replyToAdminSupportTicket: async (
    id: string,
    payload: CreateSupportReplyPayload,
  ): Promise<AppSupportTicketDetail> => {
    if (env.enableMocks) {
      const ticket = getMockSupportTicket(id)
      ticket.status = payload.status ?? 'waiting_for_traveler'
      ticket.updatedAt = new Date().toISOString()
      ticket.messages.push({
        from: 'agent',
        body: payload.message.trim(),
        timestamp: ticket.updatedAt,
      })
      return resolveAfter(mapMockSupportTicketDetail(ticket))
    }

    const response = await apiClient.replyToAdminSupportTicket(id, {
      message: payload.message.trim(),
      status: payload.status,
    })
    return mapApiSupportTicketDetail(response)
  },
  updateAdminSupportTicketStatus: async (
    id: string,
    payload: UpdateSupportTicketStatusPayload,
  ): Promise<AppSupportTicketDetail> => {
    if (env.enableMocks) {
      const ticket = getMockSupportTicket(id)
      ticket.status = payload.status
      ticket.updatedAt = new Date().toISOString()
      return resolveAfter(mapMockSupportTicketDetail(ticket))
    }

    const response = await apiClient.updateAdminSupportTicket(id, payload)
    return mapApiSupportTicketDetail(response)
  },
  getFaqs: () => resolveAfter(faqs),
  getHelpTopics: () => resolveAfter(helpTopics),
}

function getMockSupportTicket(id: string) {
  const ticket = supportTickets.find((item) => item.id === id)

  if (!ticket) {
    throw new Error('Support ticket not found.')
  }

  return ticket
}

function normalizeSupportStatus(status?: string) {
  if (status === 'waiting') {
    return 'waiting_for_traveler'
  }

  return status === 'in_review' || status === 'waiting_for_traveler' || status === 'resolved'
    ? status
    : 'open'
}

function getTopicLabel(topicId?: string) {
  return helpTopics.find((topic) => topic.id === topicId)?.title ?? 'General support'
}

function mapMockSupportTicket(ticket: MockSupportTicket): AppSupportTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    topicId: ticket.topicId ?? 'bookings',
    topicLabel: getTopicLabel(ticket.topicId),
    subject: ticket.subject,
    requesterName: ticket.fullName ?? 'Traveler',
    requesterEmail: ticket.email ?? 'traveler@example.com',
    bookingReference: ticket.bookingReference,
    messagePreview: ticket.messages[0]?.body ?? '',
    status: normalizeSupportStatus(ticket.status),
    createdAt: ticket.messages[0]?.timestamp ?? ticket.updatedAt,
    updatedAt: ticket.updatedAt,
  }
}

function mapMockSupportTicketDetail(ticket: MockSupportTicket): AppSupportTicketDetail {
  const base = mapMockSupportTicket(ticket)

  return {
    ...base,
    message: ticket.messages[0]?.body ?? '',
    replies: ticket.messages.slice(1).map((message, index) => ({
      id: `${ticket.id}-reply-${index + 1}`,
      authorName: message.from === 'agent' ? 'Support team' : base.requesterName,
      authorRole: message.from === 'agent' ? 'support' : 'traveler',
      message: message.body,
      createdAt: message.timestamp,
    })),
  }
}

function mapApiSupportTicket(ticket: ApiSupportTicket): AppSupportTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    topicId: ticket.topic_id,
    topicLabel: getTopicLabel(ticket.topic_id),
    subject: ticket.subject,
    requesterName: ticket.requester_name,
    requesterEmail: ticket.requester_email,
    bookingReference: ticket.booking_reference,
    messagePreview: ticket.message_preview,
    status: normalizeSupportStatus(ticket.status),
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }
}

function mapApiSupportTicketDetail(ticket: ApiSupportTicketDetail): AppSupportTicketDetail {
  return {
    ...mapApiSupportTicket(ticket),
    message: ticket.message,
    replies: ticket.replies.map((reply) => ({
      id: reply.id,
      authorName: reply.author_name,
      authorRole: reply.author_role === 'traveler' ? 'traveler' : 'support',
      message: reply.message,
      createdAt: reply.created_at,
    })),
  }
}
