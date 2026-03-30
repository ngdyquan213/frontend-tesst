import { useAdminDocumentsQuery } from '@/features/admin/documents/queries/useAdminDocumentsQuery'
import { Table } from '@/shared/ui/Table'

export const DocumentReviewTable = () => {
  const { data } = useAdminDocumentsQuery()
  return (
    <Table columns={['Document', 'Status', 'Uploaded']}>
      {data?.map((document) => (
        <tr key={document.id}>
          <td className="px-6 py-4 font-semibold text-primary">{document.title}</td>
          <td className="px-6 py-4 text-on-surface-variant">{document.status}</td>
          <td className="px-6 py-4 text-on-surface-variant">{document.uploadedAt}</td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-secondary">Verify</td>
        </tr>
      ))}
    </Table>
  )
}

