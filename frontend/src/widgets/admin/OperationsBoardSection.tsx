import { OperationsBoard } from '@/features/admin/operations/ui/OperationsBoard'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const OperationsBoardSection = () => (
  <section>
    <SectionHeader title="Operations board" />
    <OperationsBoard />
  </section>
)

