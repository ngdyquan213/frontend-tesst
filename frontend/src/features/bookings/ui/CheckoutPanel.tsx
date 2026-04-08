import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'
import { Button } from '@/shared/ui/Button'

interface CheckoutPanelProps {
  total: number
  ctaLabel: string
  to?: string
  onAction?: () => void | Promise<void>
  scheduleLabel?: string
  travelerLabel?: string
  disabled?: boolean
  loading?: boolean
}

export const CheckoutPanel = ({
  total,
  ctaLabel,
  to,
  onAction,
  scheduleLabel,
  travelerLabel,
  disabled = false,
  loading = false,
}: CheckoutPanelProps) => (
  <Card className="self-start lg:sticky lg:top-24">
    <div className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">Summary</div>
    <div className="mb-6 flex items-center justify-between text-2xl font-extrabold text-primary">
      <span>Total</span>
      <CurrencyText value={total} />
    </div>
    <div className="mb-6 space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
      <p>{scheduleLabel ?? 'Choose a departure to continue.'}</p>
      <p>{travelerLabel ?? 'Traveler details will appear here once they load.'}</p>
    </div>
    <p className="mb-6 text-sm leading-6 text-on-surface-variant">
      Review the itinerary details here, then continue to payment to reserve inventory and create the booking in one step.
    </p>
    {onAction ? (
      <Button className="w-full" size="lg" disabled={disabled} loading={loading} onClick={() => void onAction()}>
        {disabled ? 'Select a departure first' : ctaLabel}
      </Button>
    ) : to && !disabled ? (
      <Link
        className="inline-flex w-full items-center justify-center rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold !text-white shadow-[0_14px_32px_rgba(0,17,58,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--color-primary-strong)]"
        to={to}
      >
        {ctaLabel}
      </Link>
    ) : (
      <Button className="w-full" size="lg" disabled>
        {disabled ? 'Select a departure first' : ctaLabel}
      </Button>
    )}
  </Card>
)
