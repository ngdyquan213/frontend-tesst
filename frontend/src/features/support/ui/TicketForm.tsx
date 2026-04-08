import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useBookingsQuery } from '@/features/bookings/queries/useBookingsQuery'
import { useCreateSupportTicketMutation } from '@/features/support/queries/useCreateSupportTicketMutation'
import { useHelpTopicsQuery } from '@/features/support/queries/useHelpTopicsQuery'
import {
  validateCreateSupportTicketPayload,
} from '@/features/support/model/support.schema'
import type {
  CreateSupportTicketPayload,
  SupportTicketFormErrors,
  SupportTicketFormField,
} from '@/features/support/model/support.types'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

interface TicketFormProps {
  className?: string
  initialTopicId?: string
}

const EMPTY_FORM_STATE: CreateSupportTicketPayload = {
  fullName: '',
  email: '',
  topicId: '',
  subject: '',
  message: '',
  bookingReference: '',
}

function getFieldClassName(hasError: boolean) {
  return cn(
    'w-full rounded-[1.25rem] border bg-white px-4 py-3 text-sm text-[color:var(--color-on-surface)] outline-none transition-colors',
    'border-[color:var(--color-outline-variant)] focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]',
    hasError && 'border-red-400 focus:border-red-500 focus:ring-red-100'
  )
}

function buildInitialState(initialTopicId?: string): CreateSupportTicketPayload {
  if (!initialTopicId) {
    return { ...EMPTY_FORM_STATE }
  }

  return {
    ...EMPTY_FORM_STATE,
    topicId: initialTopicId,
  }
}

export function TicketForm({ className, initialTopicId }: TicketFormProps) {
  const { user } = useAuth()
  const bookingsQuery = useBookingsQuery()
  const topicsQuery = useHelpTopicsQuery()
  const createTicketMutation = useCreateSupportTicketMutation()
  const [formState, setFormState] = useState<CreateSupportTicketPayload>(() => buildInitialState(initialTopicId))
  const [errors, setErrors] = useState<SupportTicketFormErrors>({})
  const [submittedReference, setSubmittedReference] = useState<string | null>(null)

  const topicOptions = useMemo(
    () =>
      topicsQuery.data?.map((topic) => ({
        value: topic.id,
        label: topic.title,
      })) ?? [],
    [topicsQuery.data]
  )

  useEffect(() => {
    if (!user) {
      return
    }

    setFormState((currentState) => ({
      ...currentState,
      fullName: currentState.fullName || user.name,
      email: currentState.email || user.email,
    }))
  }, [user])

  function updateField<K extends SupportTicketFormField>(field: K, value: CreateSupportTicketPayload[K]) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }))
    }

    if (submittedReference) {
      setSubmittedReference(null)
    }

    if (createTicketMutation.isError) {
      createTicketMutation.reset()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = validateCreateSupportTicketPayload(formState)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})

    try {
      const createdTicket = await createTicketMutation.mutateAsync(validation.normalizedPayload)
      setSubmittedReference(createdTicket.reference ?? null)
      setFormState({
        ...buildInitialState(initialTopicId),
        fullName: user?.name ?? '',
        email: user?.email ?? '',
      })
    } catch {
      return
    }
  }

  return (
    <form className={cn('space-y-5', className)} onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[color:var(--color-primary)]">
          Contact support
        </p>
        <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
          Share your request and our concierge team will route it to the right booking, payment, or traveler support specialist.
        </p>
      </div>

      {submittedReference ? (
        <div className="rounded-[1.5rem] border border-[color:var(--color-secondary-container)] bg-[color:var(--color-secondary-container)]/35 px-4 py-3 text-sm text-[color:var(--color-secondary-strong)]">
          Your request has been received. Reference <span className="font-semibold">{submittedReference}</span> is now open for follow-up.
        </div>
      ) : null}

      {createTicketMutation.isError ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {createTicketMutation.error.message || 'We could not submit your request just now. Please try again.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">Full name</span>
          <input
            value={formState.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            placeholder="Your name"
            className={getFieldClassName(Boolean(errors.fullName))}
          />
          {errors.fullName ? <span className="text-sm text-red-600">{errors.fullName}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">Email address</span>
          <input
            type="email"
            value={formState.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="name@example.com"
            className={getFieldClassName(Boolean(errors.email))}
          />
          {errors.email ? <span className="text-sm text-red-600">{errors.email}</span> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">Support topic</span>
          <select
            value={formState.topicId}
            onChange={(event) => updateField('topicId', event.target.value)}
            className={getFieldClassName(Boolean(errors.topicId))}
          >
            <option value="">Choose a topic</option>
            {topicOptions.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          {topicsQuery.isLoading ? (
            <span className="text-sm text-[color:var(--color-on-surface-variant)]">Loading support topics...</span>
          ) : null}
          {topicsQuery.isError ? (
            <span className="text-sm text-red-600">Topics could not be loaded. You can still submit a general request.</span>
          ) : null}
          {errors.topicId ? <span className="text-sm text-red-600">{errors.topicId}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">Booking reference</span>
          <select
            value={formState.bookingReference ?? ''}
            onChange={(event) => updateField('bookingReference', event.target.value)}
            className={getFieldClassName(Boolean(errors.bookingReference))}
          >
            <option value="">Not tied to a booking</option>
            {(bookingsQuery.data ?? []).map((booking) => (
              <option key={booking.id} value={booking.reference}>
                {booking.reference}
              </option>
            ))}
          </select>
          {errors.bookingReference ? (
            <span className="text-sm text-red-600">{errors.bookingReference}</span>
          ) : (
            <span className="text-sm text-[color:var(--color-on-surface-variant)]">
              Add it if your question is tied to an existing reservation.
            </span>
          )}
        </label>
      </div>

      {bookingsQuery.isPending ? (
        <span className="block text-sm text-[color:var(--color-on-surface-variant)]">
          Loading your recent bookings...
        </span>
      ) : null}

      <label className="space-y-2">
        <span className="text-sm font-semibold text-[color:var(--color-primary)]">Subject</span>
        <input
          value={formState.subject}
          onChange={(event) => updateField('subject', event.target.value)}
          placeholder="How can we help?"
          className={getFieldClassName(Boolean(errors.subject))}
        />
        {errors.subject ? <span className="text-sm text-red-600">{errors.subject}</span> : null}
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-[color:var(--color-primary)]">Message</span>
        <textarea
          value={formState.message}
          onChange={(event) => updateField('message', event.target.value)}
          placeholder="Share the situation, what you need, and any timing considerations."
          rows={6}
          className={getFieldClassName(Boolean(errors.message))}
        />
        {errors.message ? (
          <span className="text-sm text-red-600">{errors.message}</span>
        ) : (
          <span className="text-sm text-[color:var(--color-on-surface-variant)]">
            The more context you add, the fewer follow-up messages will be needed.
          </span>
        )}
      </label>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
          Average first reply time: within 12 hours for standard inquiries.
        </p>
        <Button type="submit" variant="hero" size="lg" loading={createTicketMutation.isPending}>
          Send request
        </Button>
      </div>
    </form>
  )
}
