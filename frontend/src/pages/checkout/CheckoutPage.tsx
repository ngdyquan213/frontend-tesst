import { useAuth } from '@/app/providers/AuthProvider'
import { CheckoutPanel } from '@/features/bookings/ui/CheckoutPanel'
import { Alert } from '@/shared/ui/Alert'
import { CheckoutSummarySection } from '@/widgets/checkout/CheckoutSummarySection'
import { TravelerInfoSection } from '@/widgets/checkout/TravelerInfoSection'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

const CheckoutPage = () => {
  const { isAuthenticated } = useAuth()
  const checkout = useCheckoutContext()

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_22rem]">
      <div className="space-y-8">
        <Alert tone="info">
          Step 1 of 2: Review the selected departure, then continue to secure payment to create the booking and payment request together.
        </Alert>
        <CheckoutSummarySection
          destinationLabel={checkout.destinationLabel}
          scheduleLabel={checkout.scheduleLabel}
          travelerLabel={checkout.travelerLabel}
          leadTravelerName={checkout.leadTravelerName}
          scheduleId={checkout.scheduleId}
          isLoading={checkout.detailQuery.isPending}
        />
        <TravelerInfoSection />
      </div>
      <CheckoutPanel
        ctaLabel="Continue to payment"
        total={checkout.totalAmount}
        scheduleLabel={checkout.scheduleLabel}
        travelerLabel={checkout.travelerLabel}
        to={isAuthenticated ? checkout.paymentPath : '/auth/login'}
        disabled={!checkout.scheduleId || !checkout.tourId}
      />
    </div>
  )
}

export default CheckoutPage
