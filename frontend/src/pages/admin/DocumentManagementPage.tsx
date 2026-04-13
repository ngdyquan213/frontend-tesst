import { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useAdminDocumentsQuery } from '@/features/admin/documents/queries/useAdminDocumentsQuery'
import { DocumentReviewTable } from '@/features/admin/documents/ui/DocumentReviewTable'
import { ADMIN_PERMISSIONS } from '@/shared/constants/permissions'
import { hasPermission } from '@/shared/lib/auth'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

const DocumentManagementPage = () => {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const documentsQuery = useAdminDocumentsQuery(page, PAGE_SIZE)
  const total = documentsQuery.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-10">
      <PageHeader
        title="Document Management"
        description="Review traveler uploads, approve valid files, and reject anything that needs a corrected re-upload."
      />
      <DocumentReviewTable
        documents={documentsQuery.data?.items}
        isPending={documentsQuery.isPending}
        errorMessage={
          documentsQuery.isError ? 'We could not load the document moderation queue right now.' : undefined
        }
        canReview={hasPermission(user, ADMIN_PERMISSIONS.documentsWrite)}
      />
      {total > PAGE_SIZE ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  )
}

export default DocumentManagementPage
