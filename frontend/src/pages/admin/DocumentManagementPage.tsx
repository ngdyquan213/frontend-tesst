import { DocumentReviewTable } from '@/features/admin/documents/ui/DocumentReviewTable'
import { PageHeader } from '@/shared/components/PageHeader'

const DocumentManagementPage = () => (
  <div className="space-y-10">
    <PageHeader title="Document Management" />
    <DocumentReviewTable />
  </div>
)

export default DocumentManagementPage

