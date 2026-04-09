import { useAdminDocumentsQuery } from '@/features/admin/documents/queries/useAdminDocumentsQuery'
import { useVerifyDocumentMutation } from '@/features/admin/documents/queries/useVerifyDocumentMutation'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
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

export const DocumentReviewTable = ({ canReview = true }: { canReview?: boolean }) => {
  const { data, isPending } = useAdminDocumentsQuery()
  const verifyMutation = useVerifyDocumentMutation()

  if (isPending) {
    return <Alert tone="info">Loading the current document moderation queue.</Alert>
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Document review queue is empty"
        description="Traveler uploads waiting for review will appear here."
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
      {data?.map((document) => (
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
                onClick={() => verifyMutation.mutate({ documentId: document.id, status: 'approved' })}
              >
                {document.status === 'verified' ? 'Verified' : 'Approve'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canReview || document.status === 'rejected' || verifyMutation.isPending}
                onClick={() => verifyMutation.mutate({ documentId: document.id, status: 'rejected' })}
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
