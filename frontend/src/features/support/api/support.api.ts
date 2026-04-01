import { resolveAfter } from '@/shared/api/apiClient'
import { bookings, supportTickets } from '@/shared/api/mockData'
import type { CreateSupportTicketPayload, FaqItem, HelpTopic } from '@/features/support/model/support.types'
import type { SupportTicket } from '@/shared/types/common'

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
  getSupportTickets: () => resolveAfter(supportTickets),
  getSupportTicketDetail: (id: string) => resolveAfter(supportTickets.find((ticket) => ticket.id === id) ?? supportTickets[0]),
  createSupportTicket: async (payload: CreateSupportTicketPayload) => {
    const normalizedBookingReference = payload.bookingReference.trim()
    const matchedBooking = bookings.find(
      (booking) => booking.reference.toLowerCase() === normalizedBookingReference.toLowerCase()
    )
    const createdTicket: SupportTicket = {
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

    return resolveAfter(createdTicket)
  },
  getFaqs: () => resolveAfter(faqs),
  getHelpTopics: () => resolveAfter(helpTopics),
}
