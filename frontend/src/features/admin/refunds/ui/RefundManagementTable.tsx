import type { RefundRecord } from '@/shared/types/common'
import { Alert } from '@/shared/ui/Alert'
import { CurrencyText } from '@/shared/components/CurrencyText'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Table } from '@/shared/ui/Table'

interface RefundManagementTableProps {
  refunds?: RefundRecord[]
  isPending?: boolean
  errorMessage?: string
}

export const RefundManagementTable = ({
  refunds,
  isPending = false,
  errorMessage,
}: RefundManagementTableProps) => {
  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  if (errorMessage) {
    return <Alert tone="danger">{errorMessage}</Alert>
  }

  if (!refunds || refunds.length === 0) {
    return (
      <EmptyState
        title="No refunds found"
        description="Refund requests on the current page will appear here."
      />
    )
  }

  return (
    <Table columns={['Refund', 'Status', 'Amount']}>
      {refunds.map((refund) => (
        <tr key={refund.id}>
          <td className="px-6 py-4 font-semibold text-primary">{refund.id}</td>
          <td className="px-6 py-4 text-on-surface-variant">{refund.status}</td>
          <td className="px-6 py-4 text-on-surface-variant">
            <CurrencyText value={refund.amount} currency={refund.currency} />
          </td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-secondary">Review</td>
        </tr>
      ))}
    </Table>
  )
}
