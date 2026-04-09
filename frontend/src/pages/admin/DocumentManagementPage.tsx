import { useAuth } from '@/app/providers/AuthProvider'
import { DocumentReviewTable } from '@/features/admin/documents/ui/DocumentReviewTable'
import { ADMIN_PERMISSIONS } from '@/shared/constants/permissions'
import { hasPermission } from '@/shared/lib/auth'
import { PageHeader } from '@/shared/components/PageHeader'

const DocumentManagementPage = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-10">
      <PageHeader
        title="Document Management"
        description="Review traveler uploads, approve valid files, and reject anything that needs a corrected re-upload."
      />
      <DocumentReviewTable canReview={hasPermission(user, ADMIN_PERMISSIONS.documentsWrite)} />
    </div>
  )
}

export default DocumentManagementPage
