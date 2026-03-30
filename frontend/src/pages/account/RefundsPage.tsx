import { useRefundsQuery } from '@/features/refunds/queries/useRefundsQuery'
import { RefundPolicyNotice } from '@/features/refunds/ui/RefundPolicyNotice'
import { RefundRequestForm } from '@/features/refunds/ui/RefundRequestForm'
import { Card } from '@/shared/ui/Card'
import { PageHeader } from '@/shared/components/PageHeader'

const RefundsPage = () => {
  const { data } = useRefundsQuery()
  return (
    <div className="space-y-10">
      <PageHeader title="Refunds" description="Refund requests and review stages are now in one continuous flow." />
      <RefundPolicyNotice />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <RefundRequestForm />
        <div className="grid gap-4">
          {data?.map((refund) => (
            <Card key={refund.id}>
              <h3 className="font-bold text-primary">{refund.id}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{refund.reason}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RefundsPage

