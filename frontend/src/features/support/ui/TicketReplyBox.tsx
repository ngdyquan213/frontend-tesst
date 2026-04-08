import { cn } from '@/shared/lib/cn'

interface TicketReplyBoxProps {
  authorName: string
  authorRole: 'traveler' | 'support'
  message: string
  createdAt: string
}

function formatReplyTimestamp(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export const TicketReplyBox = ({
  authorName,
  authorRole,
  message,
  createdAt,
}: TicketReplyBoxProps) => (
  <div
    className={cn(
      'rounded-[1.5rem] border px-4 py-3',
      authorRole === 'support'
        ? 'border-[color:var(--color-secondary-container)] bg-[color:var(--color-secondary-container)]/35'
        : 'border-[color:var(--color-outline-variant)] bg-white',
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-[color:var(--color-primary)]">{authorName}</div>
        <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
          {authorRole === 'support' ? 'Support team' : 'Traveler'}
        </div>
      </div>
      <div className="text-xs text-[color:var(--color-on-surface-variant)]">
        {formatReplyTimestamp(createdAt)}
      </div>
    </div>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--color-on-surface)]">
      {message}
    </p>
  </div>
)
