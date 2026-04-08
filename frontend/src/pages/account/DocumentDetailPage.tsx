import { useParams } from 'react-router-dom'
import { useDocumentDetailQuery } from '@/features/documents/queries/useDocumentDetailQuery'
import { DocumentCard } from '@/features/documents/ui/DocumentCard'
import { VerificationStatus } from '@/features/documents/ui/VerificationStatus'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const DocumentDetailPage = () => {
  const { documentId } = useParams()
  const { data, isPending, isError, error } = useDocumentDetailQuery(documentId)

  if (!documentId) {
    return (
      <EmptyState
        title="Document unavailable"
        description="We could not determine which document you wanted to view."
      />
    )
  }

  if (isPending) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Document unavailable"
        description={error?.message || 'We could not load this document right now.'}
      />
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader title={data.title} description={data.type} />
      <VerificationStatus status={data.status} />
      <DocumentCard document={data} />
    </div>
  )
}

export default DocumentDetailPage
