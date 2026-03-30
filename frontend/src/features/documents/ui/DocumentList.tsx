import { Link } from 'react-router-dom'
import { useDocumentsQuery } from '@/features/documents/queries/useDocumentsQuery'
import { Card } from '@/shared/ui/Card'

export const DocumentList = () => {
  const { data } = useDocumentsQuery()
  return (
    <div className="grid gap-4">
      {data?.map((document) => (
        <Card key={document.id} className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-primary">{document.title}</h3>
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

