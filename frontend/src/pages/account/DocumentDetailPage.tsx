import { useParams } from 'react-router-dom'
import { useDocumentDetailQuery } from '@/features/documents/queries/useDocumentDetailQuery'
import { DocumentCard } from '@/features/documents/ui/DocumentCard'
import { VerificationStatus } from '@/features/documents/ui/VerificationStatus'
import { PageHeader } from '@/shared/components/PageHeader'

const DocumentDetailPage = () => {
  const { documentId = 'document-1' } = useParams()
  const { data } = useDocumentDetailQuery(documentId)
  if (!data) return null

  return (
    <div className="space-y-10">
      <PageHeader title={data.title} description={data.type} />
      <VerificationStatus status={data.status} />
      <DocumentCard document={data} />
    </div>
  )
}

export default DocumentDetailPage

