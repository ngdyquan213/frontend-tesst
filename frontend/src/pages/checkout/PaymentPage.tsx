import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPaymentResultPath } from '@/app/router/routePaths'
import { useAvailablePaymentMethodsQuery } from '@/features/payments/queries/useAvailablePaymentMethodsQuery'
import { useCreatePaymentIntentMutation } from '@/features/payments/queries/useCreatePaymentIntentMutation'
import { filterSupportedCheckoutPaymentMethods } from '@/features/payments/lib/paymentMethodAvailability'
import { PaymentMethodSelector } from '@/features/payments/ui/PaymentMethodSelector'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PaymentSummarySection } from '@/widgets/checkout/PaymentSummarySection'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

function getPreferredPaymentMethodId(methodIds: string[]) {
  return methodIds.find((id) => id === 'manual') ?? methodIds[0] ?? ''
}

function getPrimaryActionLabel(methodId: string) {
  return methodId === 'manual' ? 'Create booking request' : 'Continue to payment'
}

function getPaymentResult(status: 'pending' | 'processing' | 'success' | 'failed') {
  if (status === 'success') {
    return 'success'
  }

  if (status === 'failed') {
    return 'failed'
  }

  return 'pending'
}

const PaymentPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const checkout = useCheckoutContext()
  const createPaymentIntentMutation = useCreatePaymentIntentMutation()
  const paymentMethodsQuery = useAvailablePaymentMethodsQuery()
  const availablePaymentMethods = filterSupportedCheckoutPaymentMethods(paymentMethodsQuery.data ?? [])
  const [selectedMethodId, setSelectedMethodId] = useState<string>('')
  const primaryActionLabel = getPrimaryActionLabel(selectedMethodId)

  useEffect(() => {
    if (!availablePaymentMethods.length) {
      if (selectedMethodId) {
        setSelectedMethodId('')
      }
      return
    }

    if (
      !selectedMethodId ||
      !availablePaymentMethods.some((method) => method.id === selectedMethodId)
    ) {
      setSelectedMethodId(
        getPreferredPaymentMethodId(availablePaymentMethods.map((method) => method.id)),
      )
    }
  }, [availablePaymentMethods, selectedMethodId])

  const isPayNowDisabled =
    !checkout.tourId ||
    !checkout.scheduleId ||
    !selectedMethodId ||
    (typeof checkout.availableSlots === 'number' && checkout.travelerCount > checkout.availableSlots) ||
    paymentMethodsQuery.isLoading ||
    createPaymentIntentMutation.isPending

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_22rem]">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Payment</h1>
          <p className="mt-2 text-on-surface-variant">
            Choose a payment method to create your booking and payment request together in one idempotent checkout step.
          </p>
        </div>

        {!isAuthenticated ? (
          <Alert tone="info">
            Sign in is required before we can reserve inventory and create your payment request.
          </Alert>
        ) : null}

        {paymentMethodsQuery.isError ? (
          <Alert tone="danger">
            We could not load payment methods right now. Please refresh and try again.
          </Alert>
        ) : null}

        {!paymentMethodsQuery.isLoading &&
        !paymentMethodsQuery.isError &&
        availablePaymentMethods.length === 0 ? (
          <Alert tone="info">
            No payment methods are available for this checkout right now. Please contact support or
            try again later.
          </Alert>
        ) : null}

        {createPaymentIntentMutation.isError ? (
          <Alert tone="danger">
            {createPaymentIntentMutation.error.message || 'We could not create the payment request right now.'}
          </Alert>
        ) : null}

        {typeof checkout.availableSlots === 'number' && checkout.travelerCount > checkout.availableSlots ? (
          <Alert tone="danger">
            The selected traveler mix is larger than the remaining slots for this departure.
          </Alert>
        ) : null}

        {selectedMethodId === 'manual' ? (
          <Alert tone="info">
            Manual settlement creates the booking now and keeps payment pending until your offline
            transfer is reviewed.
          </Alert>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Available methods</h2>
          {paymentMethodsQuery.isLoading ? (
            <Alert tone="info">Loading payment methods...</Alert>
          ) : (
            <PaymentMethodSelector
              methods={availablePaymentMethods}
              selectedId={selectedMethodId}
              onChange={setSelectedMethodId}
            />
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="button" size="lg" variant="outline" onClick={() => navigate(checkout.checkoutPath)}>
            Back to checkout
          </Button>
          <Button
            type="button"
            size="lg"
            loading={createPaymentIntentMutation.isPending}
            disabled={isPayNowDisabled}
            onClick={async () => {
              if (!isAuthenticated) {
                navigate('/auth/login')
                return
              }

              if (!checkout.tourId || !checkout.scheduleId || !selectedMethodId) {
                return
              }

              const payment = await createPaymentIntentMutation.mutateAsync({
                methodId: selectedMethodId,
                tourId: checkout.tourId,
                scheduleId: checkout.scheduleId,
                travelerCounts: checkout.travelerCounts,
                travelDate:
                  checkout.selectedSchedule?.departure_date ?? new Date().toISOString().slice(0, 10),
              })

              navigate(
                buildPaymentResultPath(getPaymentResult(payment.status), {
                  tourId: checkout.tourId,
                  scheduleId: checkout.scheduleId,
                  bookingId: payment.bookingId,
                  paymentId: payment.id,
                  adultCount: checkout.travelerCounts.adultCount,
                  childCount: checkout.travelerCounts.childCount,
                  infantCount: checkout.travelerCounts.infantCount,
                }),
              )
            }}
          >
            {primaryActionLabel}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <PaymentSummarySection
          amount={checkout.totalAmount}
          tourName={checkout.tourName}
          scheduleLabel={checkout.scheduleLabel}
          travelerLabel={checkout.travelerLabel}
          isLoading={checkout.detailQuery.isPending}
        />
      </div>
    </div>
  )
}

export default PaymentPage
