import { CheckoutPanel } from '@/features/bookings/ui/CheckoutPanel'
import { Alert } from '@/shared/ui/Alert'
import { CheckoutSummarySection } from '@/widgets/checkout/CheckoutSummarySection'
import { TravelerInfoSection } from '@/widgets/checkout/TravelerInfoSection'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

const CheckoutPage = () => {
  const checkout = useCheckoutContext()

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_22rem]">
      <div className="space-y-8">
        <Alert tone="info">
          Step 1 of 3: Review your selected departure and confirm traveler information before payment.
        </Alert>
        <CheckoutSummarySection
          destinationLabel={checkout.destinationLabel}
          scheduleLabel={checkout.scheduleLabel}
          travelerLabel={checkout.travelerLabel}
          leadTravelerName={checkout.leadTraveler?.fullName}
          scheduleId={checkout.scheduleId}
          isLoading={checkout.detailQuery.isPending || checkout.travelersQuery.isPending}
        />
        <TravelerInfoSection />
      </div>
      <CheckoutPanel
        ctaLabel="Continue to payment"
        to={checkout.paymentPath}
        total={checkout.totalAmount}
        scheduleLabel={checkout.scheduleLabel}
        travelerLabel={checkout.travelerLabel}
        disabled={!checkout.scheduleId}
      />
    </div>
  )
}

export default CheckoutPage
