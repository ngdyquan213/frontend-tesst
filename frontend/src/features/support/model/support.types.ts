export type SupportTopicIconKey = 'ticket' | 'calendar' | 'wallet' | 'refund'
export type SupportTicketStatus = 'open' | 'in_review' | 'waiting_for_traveler' | 'resolved'
export type SupportReplyAuthorRole = 'traveler' | 'support'

export interface HelpTopic {
  id: string
  title: string
  description: string
  iconKey: SupportTopicIconKey
  bullets: string[]
  ctaLabel: string
  searchTerms: string[]
}

export interface FaqItem {
  id: string
  topicId: string
  categoryTitle: string
  categoryIconKey: SupportTopicIconKey
  question: string
  answer: string
}

export interface SupportTicket {
  id: string
  reference: string
  topicId: string
  topicLabel: string
  subject: string
  requesterName: string
  requesterEmail: string
  bookingReference?: string
  messagePreview: string
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
}

export interface SupportTicketReply {
  id: string
  authorName: string
  authorRole: SupportReplyAuthorRole
  message: string
  createdAt: string
}

export interface SupportTicketDetail extends SupportTicket {
  message: string
  replies: SupportTicketReply[]
}

export interface CreateSupportTicketPayload {
  fullName: string
  email: string
  topicId: string
  subject: string
  message: string
  bookingReference?: string
}

export type SupportTicketFormField = keyof CreateSupportTicketPayload
export type SupportTicketFormErrors = Partial<Record<SupportTicketFormField, string>>
