import { OperationsBoard } from '@/features/admin/operations/ui/OperationsBoard'
import { PageHeader } from '@/shared/components/PageHeader'

const OperationsPage = () => (
  <div className="space-y-10">
    <PageHeader title="Operations" />
    <OperationsBoard />
  </div>
)

export default OperationsPage

