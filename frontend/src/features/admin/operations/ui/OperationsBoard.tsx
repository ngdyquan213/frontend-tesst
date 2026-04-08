import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminOperationsQuery } from '@/features/admin/operations/queries/useAdminOperationsQuery'
import { useAdminReplyToSupportTicketMutation } from '@/features/admin/operations/queries/useAdminReplyToSupportTicketMutation'
import { useAdminSupportTicketDetailQuery } from '@/features/admin/operations/queries/useAdminSupportTicketDetailQuery'
import { useAdminSupportTicketsQuery } from '@/features/admin/operations/queries/useAdminSupportTicketsQuery'
import { useAdminUpdateSupportTicketStatusMutation } from '@/features/admin/operations/queries/useAdminUpdateSupportTicketStatusMutation'
import { TicketReplyBox } from '@/features/support/ui/TicketReplyBox'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Select } from '@/shared/ui/Select'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Textarea } from '@/shared/ui/Textarea'

const SUPPORT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'waiting_for_traveler', label: 'Waiting for traveler' },
  { value: 'resolved', label: 'Resolved' },
] as const

function normalizeSupportStatus(
  value?: string,
): 'open' | 'in_review' | 'waiting_for_traveler' | 'resolved' {
  if (value === 'in_review' || value === 'waiting_for_traveler' || value === 'resolved') {
    return value
  }

  return 'open'
}

function getStatusLabel(status: string) {
  return SUPPORT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Open'
}

function SupportThreadPanel({
  ticketId,
}: {
  ticketId: string
}) {
  const detailQuery = useAdminSupportTicketDetailQuery(ticketId)
  const replyMutation = useAdminReplyToSupportTicketMutation()
  const updateStatusMutation = useAdminUpdateSupportTicketStatusMutation()
  const [replyMessage, setReplyMessage] = useState('')
  const [status, setStatus] = useState<'open' | 'in_review' | 'waiting_for_traveler' | 'resolved'>(
    'open',
  )
  const statusRef = useRef<'open' | 'in_review' | 'waiting_for_traveler' | 'resolved'>('open')
  const hasPendingStatusSelectionRef = useRef(false)
  const statusFieldRef = useRef<HTMLSelectElement | null>(null)

  useEffect(() => {
    if (!hasPendingStatusSelectionRef.current && detailQuery.data?.status) {
      const nextStatus = normalizeSupportStatus(detailQuery.data.status)
      statusRef.current = nextStatus
      setStatus(nextStatus)
      if (statusFieldRef.current) {
        statusFieldRef.current.value = nextStatus
      }
    }
  }, [detailQuery.data?.status])

  useEffect(() => {
    hasPendingStatusSelectionRef.current = false
  }, [ticketId])

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedMessage = replyMessage.trim()

    if (!normalizedMessage) {
      return
    }

    try {
      const submittedStatus = statusRef.current
      const updatedTicket = await replyMutation.mutateAsync({
        id: ticketId,
        message: normalizedMessage,
        status: submittedStatus,
      })
      setReplyMessage('')

      if (statusRef.current !== submittedStatus) {
        return
      }

      const nextStatus = normalizeSupportStatus(updatedTicket.status)
      statusRef.current = nextStatus
      setStatus(nextStatus)
      hasPendingStatusSelectionRef.current = false
      if (statusFieldRef.current) {
        statusFieldRef.current.value = nextStatus
      }
    } catch {
      return
    }
  }

  async function handleStatusUpdate() {
    try {
      const selectedStatus = (statusFieldRef.current?.value as
        | 'open'
        | 'in_review'
        | 'waiting_for_traveler'
        | 'resolved'
        | undefined) ?? statusRef.current

      const updatedTicket = await updateStatusMutation.mutateAsync({
        id: ticketId,
        status: selectedStatus,
      })
      const nextStatus = normalizeSupportStatus(updatedTicket.status)
      statusRef.current = nextStatus
      setStatus(nextStatus)
      hasPendingStatusSelectionRef.current = false
    } catch {
      return
    }
  }

  if (detailQuery.isPending) {
    return (
      <Card className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <EmptyState
        title="Support thread unavailable"
        description={detailQuery.error?.message || 'We could not load this support thread right now.'}
      />
    )
  }

  const ticket = detailQuery.data

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            {ticket.reference}
          </div>
          <h3 className="mt-2 text-2xl font-bold text-primary">{ticket.subject}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            {ticket.requesterName} · {ticket.requesterEmail}
            {ticket.bookingReference ? ` · ${ticket.bookingReference}` : ''}
          </p>
        </div>
        <div className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-primary">
          {getStatusLabel(ticket.status)}
        </div>
      </div>

      <div className="grid gap-3">
        <TicketReplyBox
          authorName={ticket.requesterName}
          authorRole="traveler"
          message={ticket.message}
          createdAt={ticket.createdAt}
        />
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

      <div className="grid gap-4 rounded-[1.5rem] border border-[color:var(--color-outline-variant)]/60 bg-[color:var(--color-surface-low)] p-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-primary">Ticket status</span>
          <Select
            key={`${ticket.id}:${ticket.updatedAt}`}
            ref={statusFieldRef}
            aria-label="Ticket status"
            value={status}
            onChange={(event) => {
              const nextStatus = event.target.value as
                | 'open'
                | 'in_review'
                | 'waiting_for_traveler'
                | 'resolved'
              hasPendingStatusSelectionRef.current = true
              statusRef.current = nextStatus
              setStatus(nextStatus)
            }}
          >
            {SUPPORT_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <Button
          variant="secondary"
          onClick={handleStatusUpdate}
          loading={updateStatusMutation.isPending}
        >
          Apply status
        </Button>
      </div>

      {updateStatusMutation.isError ? (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {updateStatusMutation.error.message || 'We could not update the ticket status.'}
        </div>
      ) : null}

      <form className="space-y-3" onSubmit={handleReplySubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-primary">Admin reply</span>
          <Textarea
            aria-label="Admin reply"
            value={replyMessage}
            onChange={(event) => setReplyMessage(event.target.value)}
            placeholder="Share the next action, booking update, or traveler-facing guidance."
            rows={4}
          />
        </label>

        {replyMutation.isError ? (
          <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {replyMutation.error.message || 'We could not send the admin reply.'}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="hero"
            loading={replyMutation.isPending}
            disabled={replyMessage.trim().length < 4}
          >
            Send admin reply
          </Button>
        </div>
      </form>
    </Card>
  )
}

export const OperationsBoard = () => {
  const recentActivityQuery = useAdminOperationsQuery()
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'open' | 'in_review' | 'waiting_for_traveler' | 'resolved'
  >('all')
  const supportQueueQuery = useAdminSupportTicketsQuery(
    statusFilter === 'all' ? undefined : statusFilter,
  )
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)

  const supportTickets = useMemo(() => supportQueueQuery.data ?? [], [supportQueueQuery.data])
  const selectedTicketId = useMemo(() => {
    if (activeTicketId && supportTickets.some((ticket) => ticket.id === activeTicketId)) {
      return activeTicketId
    }

    return supportTickets[0]?.id ?? ''
  }, [activeTicketId, supportTickets])

  useEffect(() => {
    if (!activeTicketId && supportTickets[0]?.id) {
      setActiveTicketId(supportTickets[0].id)
    }
  }, [activeTicketId, supportTickets])

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Support queue
            </div>
            <h2 className="mt-2 text-2xl font-bold text-primary">Traveler support operations</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-on-surface-variant">
              Review incoming tickets, keep every reply on-thread, and move each traveler request
              through a clear operational status.
            </p>
          </div>
          <div className="min-w-52">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-primary">Filter support queue</span>
              <Select
                aria-label="Filter support queue"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'all'
                      | 'open'
                      | 'in_review'
                      | 'waiting_for_traveler'
                      | 'resolved',
                  )
                }
              >
                {SUPPORT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </div>

        {supportQueueQuery.isPending ? (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
            <Card className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </Card>
            <Card className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
        ) : supportQueueQuery.isError ? (
          <EmptyState
            title="Support queue unavailable"
            description={
              supportQueueQuery.error.message || 'We could not load the admin support queue.'
            }
          />
        ) : supportTickets.length === 0 ? (
          <EmptyState
            title="No tickets in this queue"
            description="New support requests will appear here as soon as travelers submit them."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
            <div className="space-y-3">
              {supportTickets.map((ticket) => {
                const isActive = selectedTicketId === ticket.id

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                      isActive
                        ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)]/40'
                        : 'border-[color:var(--color-outline-variant)] bg-white hover:border-[color:var(--color-primary)]/40'
                    }`}
                    onClick={() => setActiveTicketId(ticket.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {ticket.reference}
                      </div>
                      <div className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-semibold text-primary">
                        {getStatusLabel(ticket.status)}
                      </div>
                    </div>
                    <div className="mt-3 font-semibold text-primary">{ticket.subject}</div>
                    <div className="mt-2 text-sm text-on-surface-variant">
                      {ticket.requesterName}
                      {ticket.bookingReference ? ` · ${ticket.bookingReference}` : ''}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                      {ticket.messagePreview}
                    </p>
                  </button>
                )
              })}
            </div>

            <SupportThreadPanel ticketId={selectedTicketId} />
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            Recent platform activity
          </div>
          <h3 className="mt-2 text-xl font-bold text-primary">Operational context</h3>
        </div>

        {!recentActivityQuery.data || recentActivityQuery.data.length === 0 ? (
          <EmptyState
            title="No recent operations yet"
            description="Recent admin activity will appear here once the backend emits dashboard events."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recentActivityQuery.data.map((task) => (
              <Card key={task.id}>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {task.priority}
                </div>
                <h3 className="text-xl font-bold text-primary">{task.title}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{task.summary}</p>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
