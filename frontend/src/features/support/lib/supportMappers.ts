import type {
  SupportTicket as AppSupportTicket,
  SupportTicketDetail as AppSupportTicketDetail,
} from '@/features/support/model/support.types'
import { getSupportTopicLabel } from '@/features/support/lib/supportContent'
import type {
  SupportTicket as ApiSupportTicket,
  SupportTicketDetail as ApiSupportTicketDetail,
} from '@/shared/types/api'
import type { SupportTicket as MockSupportTicket } from '@/shared/types/common'

export function getMockSupportTicket(supportTickets: MockSupportTicket[], id: string) {
  const ticket = supportTickets.find((item) => item.id === id)

  if (!ticket) {
    throw new Error('Support ticket not found.')
  }

  return ticket
}

export function normalizeSupportStatus(status?: string) {
  if (status === 'waiting') {
    return 'waiting_for_traveler'
  }

  return status === 'in_review' || status === 'waiting_for_traveler' || status === 'resolved'
    ? status
    : 'open'
}

export function mapMockSupportTicket(ticket: MockSupportTicket): AppSupportTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    topicId: ticket.topicId ?? 'bookings',
    topicLabel: getSupportTopicLabel(ticket.topicId),
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

export function mapMockSupportTicketDetail(ticket: MockSupportTicket): AppSupportTicketDetail {
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

export function mapApiSupportTicket(ticket: ApiSupportTicket): AppSupportTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    topicId: ticket.topic_id,
    topicLabel: getSupportTopicLabel(ticket.topic_id),
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

export function mapApiSupportTicketDetail(ticket: ApiSupportTicketDetail): AppSupportTicketDetail {
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
