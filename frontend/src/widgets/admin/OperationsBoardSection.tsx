import { OperationsBoard } from '@/features/admin/operations/ui/OperationsBoard'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const OperationsBoardSection = ({ canManageTickets = true }: { canManageTickets?: boolean }) => (
  <section>
    <SectionHeader title="Operations board" />
    <OperationsBoard canManageTickets={canManageTickets} />
  </section>
)
