import { PageHeader } from '@/shared/components/PageHeader'
import { DocumentList } from '@/features/documents/ui/DocumentList'
import { DocumentUploadPanel } from '@/features/documents/ui/DocumentUploadPanel'

const DocumentsPage = () => (
  <div className="space-y-10">
    <PageHeader title="Documents" description="Upload, review status, and detail views are live for release-ready document handling." />
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <DocumentUploadPanel />
      <DocumentList />
    </div>
  </div>
)

export default DocumentsPage
