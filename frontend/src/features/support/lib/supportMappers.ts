import type {
  SupportTicket as AppSupportTicket,
  SupportTicketDetail as AppSupportTicketDetail,
} from '@/features/support/model/support.types'
import type {
  SupportTicket as ApiSupportTicket,
  SupportTicketDetail as ApiSupportTicketDetail,
} from '@/shared/types/api'

function formatSupportTopicLabel(topicId?: string) {
  if (!topicId?.trim()) {
    return 'General support'
  }

  return topicId
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function normalizeSupportStatus(status?: string) {
  if (status === 'waiting') {
    return 'waiting_for_traveler'
  }

  return status === 'in_review' || status === 'waiting_for_traveler' || status === 'resolved'
    ? status
    : 'open'
}

export function mapApiSupportTicket(ticket: ApiSupportTicket): AppSupportTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    topicId: ticket.topic_id,
    topicLabel: formatSupportTopicLabel(ticket.topic_id),
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
