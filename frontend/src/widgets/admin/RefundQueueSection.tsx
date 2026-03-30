import { RefundManagementTable } from '@/features/admin/refunds/ui/RefundManagementTable'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const RefundQueueSection = () => (
  <section>
    <SectionHeader title="Refund queue" />
    <RefundManagementTable />
  </section>
)

