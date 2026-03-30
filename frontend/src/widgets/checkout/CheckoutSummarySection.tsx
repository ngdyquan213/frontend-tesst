import { Card } from '@/shared/ui/Card'

export const CheckoutSummarySection = () => (
  <Card>
    <h2 className="mb-6 text-2xl font-bold text-primary">Review your trip</h2>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-surface-container-low p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Destination</div>
        <div className="mt-2 font-semibold text-primary">Amalfi, Italy</div>
      </div>
      <div className="rounded-2xl bg-surface-container-low p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Dates</div>
        <div className="mt-2 font-semibold text-primary">Jun 12 - Jun 19, 2026</div>
      </div>
    </div>
  </Card>
)

