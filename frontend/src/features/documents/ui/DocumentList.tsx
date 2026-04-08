import { Link } from 'react-router-dom'
import { useDocumentsQuery } from '@/features/documents/queries/useDocumentsQuery'
import { VerificationStatus } from '@/features/documents/ui/VerificationStatus'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

export const DocumentList = () => {
  const { data, isPending } = useDocumentsQuery()

  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-36" />
          </Card>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No documents uploaded"
        description="Passports, insurance files, and verification documents will appear here after upload."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {data.map((document) => (
        <Card key={document.id} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-primary">{document.title}</h3>
              <VerificationStatus status={document.status} />
            </div>
            <p className="text-sm text-on-surface-variant">{document.notes}</p>
          </div>
          <Link className="text-sm font-semibold text-secondary" to={`/account/documents/${document.id}`}>
            View
          </Link>
        </Card>
      ))}
    </div>
  )
}
