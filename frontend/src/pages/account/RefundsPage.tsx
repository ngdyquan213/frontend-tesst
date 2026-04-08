import { useRefundsQuery } from '@/features/refunds/queries/useRefundsQuery'
import { RefundPolicyNotice } from '@/features/refunds/ui/RefundPolicyNotice'
import { RefundRequestForm } from '@/features/refunds/ui/RefundRequestForm'
import { Card } from '@/shared/ui/Card'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const RefundsPage = () => {
  const { data = [], isPending, isError, error } = useRefundsQuery()

  return (
    <div className="space-y-10">
      <PageHeader
        title="Refunds"
        description="Track refund requests, review stages, and payout progress in one place."
      />
      <RefundPolicyNotice />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <RefundRequestForm />
        {isPending ? (
          <div className="grid gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
              </Card>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Refund history unavailable"
            description={error.message || 'We could not load your refund history right now.'}
          />
        ) : data.length === 0 ? (
          <EmptyState
            title="No refund requests yet"
            description="When you submit a refund request, the status and payout timeline will appear here."
          />
        ) : (
          <div className="grid gap-4">
            {data.map((refund) => (
              <Card key={refund.id}>
                <h3 className="font-bold text-primary">{refund.id}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{refund.reason}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RefundsPage
