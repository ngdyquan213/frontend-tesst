import type { DocumentRecord } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'

export const DocumentCard = ({ document }: { document: DocumentRecord }) => (
  <Card>
    <h3 className="text-xl font-bold text-primary">{document.title}</h3>
    <p className="mt-2 text-sm text-on-surface-variant">{document.notes}</p>
  </Card>
)

