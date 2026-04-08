import { DocumentReviewTable } from '@/features/admin/documents/ui/DocumentReviewTable'
import { PageHeader } from '@/shared/components/PageHeader'

const DocumentManagementPage = () => (
  <div className="space-y-10">
    <PageHeader
      title="Document Management"
      description="Review traveler uploads, approve valid files, and reject anything that needs a corrected re-upload."
    />
    <DocumentReviewTable />
  </div>
)

export default DocumentManagementPage
