import { RefundManagementTable } from '@/features/admin/refunds/ui/RefundManagementTable'
import { PageHeader } from '@/shared/components/PageHeader'

const RefundManagementPage = () => (
  <div className="space-y-10">
    <PageHeader title="Refund Management" />
    <RefundManagementTable />
  </div>
)

export default RefundManagementPage

