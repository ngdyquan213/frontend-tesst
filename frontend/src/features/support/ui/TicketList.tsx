import { useSupportTicketsQuery } from '@/features/support/queries/useSupportTicketsQuery'
import { Card } from '@/shared/ui/Card'

export const TicketList = () => {
  const { data } = useSupportTicketsQuery()
  return (
    <div className="grid gap-4">
      {data?.map((ticket) => (
        <Card key={ticket.id}>
          <h3 className="font-bold text-primary">{ticket.subject}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{ticket.status}</p>
        </Card>
      ))}
    </div>
  )
}

