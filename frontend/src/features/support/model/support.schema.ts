import { validateEmail } from '@/shared/lib/validation'
import type {
  CreateSupportTicketPayload,
  SupportTicketFormErrors,
} from '@/features/support/model/support.types'

export const supportSchema = {
  fullNameMinLength: 2,
  subjectMinLength: 8,
  messageMinLength: 24,
  bookingReferencePattern: /^[A-Z0-9-]{5,20}$/i,
}

export function normalizeCreateSupportTicketPayload(payload: CreateSupportTicketPayload): CreateSupportTicketPayload {
  const bookingReference = payload.bookingReference?.trim()

  return {
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    topicId: payload.topicId.trim(),
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    ...(bookingReference ? { bookingReference } : {}),
  }
}

export function validateCreateSupportTicketPayload(payload: CreateSupportTicketPayload) {
  const normalizedPayload = normalizeCreateSupportTicketPayload(payload)
  const errors: SupportTicketFormErrors = {}

  if (normalizedPayload.fullName.length < supportSchema.fullNameMinLength) {
    errors.fullName = 'Please share the lead traveler name.'
  }

  const emailValidation = validateEmail(normalizedPayload.email)
  if (!emailValidation.valid) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!normalizedPayload.topicId) {
    errors.topicId = 'Choose the support topic that fits your request.'
  }

  if (normalizedPayload.subject.length < supportSchema.subjectMinLength) {
    errors.subject = 'Please add a short subject so our team can route this quickly.'
  }

  if (normalizedPayload.message.length < supportSchema.messageMinLength) {
    errors.message = 'Please include a bit more detail so we can help without unnecessary back-and-forth.'
  }

  if (
    normalizedPayload.bookingReference &&
    !supportSchema.bookingReferencePattern.test(normalizedPayload.bookingReference)
  ) {
    errors.bookingReference = 'Booking reference should be 5-20 letters, numbers, or dashes.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    normalizedPayload,
    errors,
  }
}
