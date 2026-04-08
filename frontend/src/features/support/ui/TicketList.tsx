import { FormEvent, useState } from 'react'
import { useReplyToSupportTicketMutation } from '@/features/support/queries/useReplyToSupportTicketMutation'
import { useSupportTicketDetailQuery } from '@/features/support/queries/useSupportTicketDetailQuery'
import { useSupportTicketsQuery } from '@/features/support/queries/useSupportTicketsQuery'
import { TicketReplyBox } from '@/features/support/ui/TicketReplyBox'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Textarea } from '@/shared/ui/Textarea'

function getStatusLabel(status: string) {
  if (status === 'waiting_for_traveler') {
    return 'Waiting for traveler'
  }

  if (status === 'in_review') {
    return 'In review'
  }

  if (status === 'resolved') {
    return 'Resolved'
  }

  return 'Open'
}

function TicketThreadPanel({
  ticketId,
  requesterName,
}: {
  ticketId: string
  requesterName: string
}) {
  const detailQuery = useSupportTicketDetailQuery(ticketId)
  const replyMutation = useReplyToSupportTicketMutation()
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedMessage = message.trim()

    if (!normalizedMessage) {
      return
    }

    try {
      await replyMutation.mutateAsync({ id: ticketId, message: normalizedMessage })
      setMessage('')
    } catch {
      return
    }
  }

  if (detailQuery.isPending) {
    return (
      <div className="space-y-3 rounded-[1.75rem] border border-[color:var(--color-outline-variant)]/60 bg-[color:var(--color-surface-low)] p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <EmptyState
        title="Thread unavailable"
        description={detailQuery.error?.message || 'We could not load this ticket thread right now.'}
      />
    )
  }

  const ticket = detailQuery.data

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--color-outline-variant)]/60 bg-[color:var(--color-surface-low)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
            Live thread
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-on-surface-variant)]">
            Keep all follow-up in one place so support can stay attached to the booking context.
          </div>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
          {getStatusLabel(ticket.status)}
        </div>
      </div>

      <TicketReplyBox
        authorName={requesterName}
        authorRole="traveler"
        message={ticket.message}
        createdAt={ticket.createdAt}
      />

      {ticket.replies.length > 0 ? (
        <div className="space-y-3">
          {ticket.replies.map((reply) => (
            <TicketReplyBox
              key={reply.id}
              authorName={reply.authorName}
              authorRole={reply.authorRole}
              message={reply.message}
              createdAt={reply.createdAt}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-[color:var(--color-outline-variant)] bg-white/70 px-4 py-3 text-sm text-[color:var(--color-on-surface-variant)]">
          No replies yet. Send a follow-up if the booking context changed or you have new details.
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">Reply message</span>
          <Textarea
            aria-label="Reply message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Add new details, timing changes, or anything support should know before the next reply."
            rows={4}
          />
        </label>

        {replyMutation.isError ? (
          <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {replyMutation.error.message || 'We could not send your follow-up right now.'}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={replyMutation.isPending}
            disabled={message.trim().length < 4}
          >
            Send follow-up
          </Button>
        </div>
      </form>
    </div>
  )
}

export const TicketList = () => {
  const { data, isPending, isError, error } = useSupportTicketsQuery()
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        title="Support inbox unavailable"
        description={error.message || 'We could not load your support history right now.'}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No support requests yet"
        description="When you submit a request, the ticket status and booking context will appear here."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {data.map((ticket) => {
        const isActive = activeTicketId === ticket.id

        return (
          <Card key={ticket.id} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {ticket.reference}
                </div>
                <h3 className="mt-2 font-bold text-primary">{ticket.subject}</h3>
              </div>
              <div className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-primary">
                {getStatusLabel(ticket.status)}
              </div>
            </div>

            <p className="text-sm text-on-surface-variant">{ticket.messagePreview}</p>
            <p className="text-xs text-on-surface-variant">
              {ticket.bookingReference ? `Booking ${ticket.bookingReference} · ` : ''}
              {ticket.topicLabel}
            </p>

            <div className="flex justify-end">
              <Button
                variant={isActive ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActiveTicketId(isActive ? null : ticket.id)}
              >
                {isActive ? 'Hide thread' : 'Open thread'}
              </Button>
            </div>

            {isActive ? (
              <TicketThreadPanel ticketId={ticket.id} requesterName={ticket.requesterName} />
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
