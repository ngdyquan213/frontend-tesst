import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'
import { Button } from '@/shared/ui/Button'

export const CheckoutPanel = ({ total, ctaLabel, to }: { total: number; ctaLabel: string; to?: string }) => (
  <Card className="sticky top-24">
    <div className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">Summary</div>
    <div className="mb-6 flex items-center justify-between text-2xl font-extrabold text-primary">
      <span>Total</span>
      <CurrencyText value={total} />
    </div>
    {to ? (
      <Link className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white" to={to}>
        {ctaLabel}
      </Link>
    ) : (
      <Button className="w-full">{ctaLabel}</Button>
    )}
  </Card>
)
