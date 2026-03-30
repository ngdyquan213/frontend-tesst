import type { Promotion } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'

export const PromotionCard = ({ promotion }: { promotion: Promotion }) => (
  <Card className="overflow-hidden p-0">
    <img alt={promotion.title} className="h-56 w-full object-cover" src={promotion.image} />
    <div className="space-y-3 p-6">
      <div className="text-xs font-bold uppercase tracking-widest text-secondary">{promotion.discountLabel}</div>
      <h3 className="text-2xl font-bold text-primary">{promotion.title}</h3>
      <p className="text-sm text-on-surface-variant">{promotion.summary}</p>
      <div className="rounded-2xl bg-surface-container px-4 py-3 text-sm font-semibold text-primary">Code: {promotion.code}</div>
    </div>
  </Card>
)

