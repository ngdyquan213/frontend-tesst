import { useParams } from 'react-router-dom'
import { useRefundDetailQuery } from '@/features/refunds/queries/useRefundDetailQuery'
import { RefundTimeline } from '@/features/refunds/ui/RefundTimeline'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const RefundDetailPage = () => {
  const { refundId } = useParams()
  const { data, isPending, isError, error } = useRefundDetailQuery(refundId)

  if (!refundId) {
    return (
      <EmptyState
        title="Refund unavailable"
        description="We could not determine which refund request you wanted to open."
      />
    )
  }

  if (isPending) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Refund unavailable"
        description={error?.message || 'We could not load this refund right now.'}
      />
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader title={`Refund ${data.id}`} description={data.reason} />
      <Card>
        <RefundTimeline refund={data} />
      </Card>
    </div>
  )
}

export default RefundDetailPage
