import { useParams } from 'react-router-dom'
import { useRefundDetailQuery } from '@/features/refunds/queries/useRefundDetailQuery'
import { RefundTimeline } from '@/features/refunds/ui/RefundTimeline'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card } from '@/shared/ui/Card'

const RefundDetailPage = () => {
  const { refundId = 'refund-1' } = useParams()
  const { data } = useRefundDetailQuery(refundId)
  if (!data) return null

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

