import type { Tour } from '@/shared/types/common'
import { Breadcrumbs } from '@/shared/navigation/Breadcrumbs'
import { Badge } from '@/shared/ui/Badge'

export const TourDetailHero = ({ tour }: { tour: Tour }) => (
  <section>
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Tours', to: '/tours' }, { label: tour.title }]} />
    <div className="relative mb-12 overflow-hidden rounded-[2rem]">
      <img alt={tour.title} className="h-[520px] w-full object-cover" src={tour.heroImage} />
      <div className="absolute left-6 top-6 flex gap-3">
        <Badge tone="info">Verified Tour</Badge>
        {tour.instantConfirmation ? <Badge tone="success">Instant Confirmation</Badge> : null}
      </div>
    </div>
  </section>
)

