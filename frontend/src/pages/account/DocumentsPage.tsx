import { PageHeader } from '@/shared/components/PageHeader'
import { DocumentList } from '@/features/documents/ui/DocumentList'
import { DocumentUploadPanel } from '@/features/documents/ui/DocumentUploadPanel'

const DocumentsPage = () => (
  <div className="space-y-10">
    <PageHeader title="Documents" description="Uploads, review states, and details are now connected." />
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <DocumentUploadPanel />
      <DocumentList />
    </div>
  </div>
)

export default DocumentsPage

