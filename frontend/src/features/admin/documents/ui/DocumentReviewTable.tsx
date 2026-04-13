import { useVerifyDocumentMutation } from '@/features/admin/documents/queries/useVerifyDocumentMutation'
import { adminDocumentsApi } from '@/features/admin/documents/api/adminDocuments.api'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Table } from '@/shared/ui/Table'

function getStatusBadgeVariant(status: 'pending' | 'verified' | 'rejected') {
  if (status === 'verified') {
    return 'success'
  }

  if (status === 'rejected') {
    return 'danger'
  }

  return 'warning'
}

type AdminDocumentRecord = Awaited<
  ReturnType<typeof adminDocumentsApi.getDocuments>
>['items'][number]

interface DocumentReviewTableProps {
  documents?: AdminDocumentRecord[]
  isPending?: boolean
  errorMessage?: string
  canReview?: boolean
}

export const DocumentReviewTable = ({
  documents,
  isPending = false,
  errorMessage,
  canReview = true,
}: DocumentReviewTableProps) => {
  const verifyMutation = useVerifyDocumentMutation()

  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  if (errorMessage) {
    return <Alert tone="danger">{errorMessage}</Alert>
  }

  if (!documents || documents.length === 0) {
    return (
      <EmptyState
        title="Document review queue is empty"
        description="Traveler uploads for the current page will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {!canReview ? (
        <Alert tone="info">
          This account can view traveler uploads but cannot approve or reject documents.
        </Alert>
      ) : null}
      {verifyMutation.isError ? <Alert tone="danger">{verifyMutation.error.message}</Alert> : null}
      <Table columns={['Document', 'Booking', 'Status', 'Uploaded', 'Actions']}>
        {documents.map((document) => (
          <tr key={document.id}>
            <td className="px-6 py-4">
              <div>
                <p className="font-semibold text-primary">{document.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{document.type}</p>
              </div>
            </td>
            <td className="px-6 py-4 text-on-surface-variant">
              {document.bookingId || 'Account upload'}
            </td>
            <td className="px-6 py-4">
              <Badge variant={getStatusBadgeVariant(document.status)}>{document.status}</Badge>
            </td>
            <td className="px-6 py-4 text-on-surface-variant">
              {new Date(document.uploadedAt).toLocaleString()}
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={verifyMutation.isPending}
                  disabled={!canReview || document.status === 'verified'}
                  onClick={() =>
                    verifyMutation.mutate({ documentId: document.id, status: 'approved' })
                  }
                >
                  {document.status === 'verified' ? 'Verified' : 'Approve'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    !canReview || document.status === 'rejected' || verifyMutation.isPending
                  }
                  onClick={() =>
                    verifyMutation.mutate({ documentId: document.id, status: 'rejected' })
                  }
                >
                  {document.status === 'rejected' ? 'Rejected' : 'Reject'}
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
