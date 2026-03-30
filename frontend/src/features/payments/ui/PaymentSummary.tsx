import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'

export const PaymentSummary = ({ amount }: { amount: number }) => (
  <Card>
    <div className="mb-2 text-sm uppercase tracking-widest text-on-surface-variant">Payment summary</div>
    <div className="flex items-center justify-between text-lg font-semibold">
      <span className="text-on-surface-variant">Amount due</span>
      <span className="text-primary">
        <CurrencyText value={amount} />
      </span>
    </div>
  </Card>
)

