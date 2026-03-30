import { CheckoutPanel } from '@/features/bookings/ui/CheckoutPanel'
import { Alert } from '@/shared/ui/Alert'
import { CheckoutSummarySection } from '@/widgets/checkout/CheckoutSummarySection'
import { TravelerInfoSection } from '@/widgets/checkout/TravelerInfoSection'

const CheckoutPage = () => (
  <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
    <div className="space-y-8">
      <Alert tone="info">Step 1 of 3: Review your trip details and traveler information.</Alert>
      <CheckoutSummarySection />
      <TravelerInfoSection />
    </div>
    <CheckoutPanel ctaLabel="Continue to payment" to="/checkout/payment" total={2598} />
  </div>
)

export default CheckoutPage

