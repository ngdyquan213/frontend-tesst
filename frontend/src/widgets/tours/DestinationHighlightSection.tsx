import type { Tour } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'

export const DestinationHighlightSection = ({ tour }: { tour: Tour }) => (
  <Card>
    <h2 className="mb-4 text-2xl font-bold text-primary">Experience Overview</h2>
    <div className="space-y-4 text-on-surface-variant">
      {tour.overview.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  </Card>
)

