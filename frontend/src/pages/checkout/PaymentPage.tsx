import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPaymentResultPath } from '@/app/router/routePaths'
import { useAvailablePaymentMethodsQuery } from '@/features/payments/queries/useAvailablePaymentMethodsQuery'
import { useCreatePaymentIntentMutation } from '@/features/payments/queries/useCreatePaymentIntentMutation'
import { PaymentMethodSelector } from '@/features/payments/ui/PaymentMethodSelector'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PaymentSummarySection } from '@/widgets/checkout/PaymentSummarySection'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

function getPreferredPaymentMethodId(methodIds: string[]) {
  return (
    methodIds.find((id) => id === 'manual') ??
    methodIds.find((id) => id !== 'stripe') ??
    methodIds[0] ??
    ''
  )
}

const PaymentPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const checkout = useCheckoutContext()
  const createPaymentIntentMutation = useCreatePaymentIntentMutation()
  const paymentMethodsQuery = useAvailablePaymentMethodsQuery()
  const [selectedMethodId, setSelectedMethodId] = useState<string>('')

  useEffect(() => {
    if (!selectedMethodId && paymentMethodsQuery.data?.length) {
      setSelectedMethodId(
        getPreferredPaymentMethodId(paymentMethodsQuery.data.map((method) => method.id)),
      )
    }
  }, [paymentMethodsQuery.data, selectedMethodId])

  const isPayNowDisabled =
    !checkout.tourId ||
    !checkout.scheduleId ||
    !selectedMethodId ||
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
        (paymentMethodsQuery.data?.length ?? 0) === 0 ? (
          <Alert tone="info">
            Payment methods are temporarily unavailable for self-service checkout. Please contact support
            or try again later.
          </Alert>
        ) : null}

        {createPaymentIntentMutation.isError ? (
          <Alert tone="danger">
            {createPaymentIntentMutation.error.message || 'We could not create the payment request right now.'}
          </Alert>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Available methods</h2>
          {paymentMethodsQuery.isLoading ? (
            <Alert tone="info">Loading payment methods...</Alert>
          ) : (
            <PaymentMethodSelector
              methods={paymentMethodsQuery.data ?? []}
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
                travelerCount: checkout.travelerCount,
                travelDate:
                  checkout.selectedSchedule?.departure_date ?? new Date().toISOString().slice(0, 10),
              })

              navigate(
                buildPaymentResultPath(payment.status === 'failed' ? 'failed' : 'success', {
                  tourId: checkout.tourId,
                  scheduleId: checkout.scheduleId,
                  bookingId: payment.bookingId,
                  paymentId: payment.id,
                }),
              )
            }}
          >
            Pay now
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
