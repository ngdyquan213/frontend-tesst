import { useAdminRefundsQuery } from '@/features/admin/refunds/queries/useAdminRefundsQuery'
import { Table } from '@/shared/ui/Table'

export const RefundManagementTable = () => {
  const { data } = useAdminRefundsQuery()
  return (
    <Table columns={['Refund', 'Status', 'Amount']}>
      {data?.map((refund) => (
        <tr key={refund.id}>
          <td className="px-6 py-4 font-semibold text-primary">{refund.id}</td>
          <td className="px-6 py-4 text-on-surface-variant">{refund.status}</td>
          <td className="px-6 py-4 text-on-surface-variant">${refund.amount}</td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-secondary">Review</td>
        </tr>
      ))}
    </Table>
  )
}

