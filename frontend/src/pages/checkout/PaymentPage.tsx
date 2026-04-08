import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildPaymentResultPath } from '@/app/router/routePaths'
import { useCreatePaymentIntentMutation } from '@/features/payments/queries/useCreatePaymentIntentMutation'
import { useAvailablePaymentMethodsQuery } from '@/features/payments/queries/useAvailablePaymentMethodsQuery'
import { PaymentMethodSelector } from '@/features/payments/ui/PaymentMethodSelector'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PaymentSummarySection } from '@/widgets/checkout/PaymentSummarySection'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

const PaymentPage = () => {
  const navigate = useNavigate()
  const checkout = useCheckoutContext()
  const paymentMethodsQuery = useAvailablePaymentMethodsQuery()
  const createPaymentIntentMutation = useCreatePaymentIntentMutation()
  const [selectedId, setSelectedId] = useState('')
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId && paymentMethodsQuery.data?.[0]?.id) {
      setSelectedId(paymentMethodsQuery.data[0].id)
    }
  }, [paymentMethodsQuery.data, selectedId])

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_22rem]">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Payment</h1>
          <p className="mt-2 text-on-surface-variant">
            Choose a payment method to complete this booking for {checkout.tourName}.
          </p>
        </div>
        {createPaymentIntentMutation.isError ? (
          <Alert tone="danger">
            {createPaymentIntentMutation.error.message ||
              'We could not start payment right now. Please try again.'}
          </Alert>
        ) : null}
        {paymentNotice ? <Alert tone="info">{paymentNotice}</Alert> : null}
        <PaymentMethodSelector
          methods={paymentMethodsQuery.data ?? []}
          onChange={setSelectedId}
          selectedId={selectedId}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            size="lg"
            loading={createPaymentIntentMutation.isPending}
            disabled={!selectedId || paymentMethodsQuery.isPending || !checkout.tourId || !checkout.scheduleId}
            onClick={async () => {
              setPaymentNotice(null)

              try {
                const payment = await createPaymentIntentMutation.mutateAsync({
                  methodId: selectedId,
                  tourId: checkout.tourId ?? '',
                  scheduleId: checkout.scheduleId ?? '',
                  travelerCount: Math.max(checkout.travelerCount, 1),
                  travelDate:
                    checkout.selectedSchedule?.departure_date ??
                    new Date().toISOString().slice(0, 10),
                })

                const navigationParams = {
                  tourId: checkout.tourId,
                  scheduleId: checkout.scheduleId,
                  paymentId: payment.id,
                }

                if (payment.status === 'success') {
                  navigate(buildPaymentResultPath('success', navigationParams))
                  return
                }

                if (payment.status === 'failed') {
                  navigate(buildPaymentResultPath('failed', navigationParams))
                  return
                }

                setPaymentNotice(
                  'Payment was created but is still pending confirmation. Complete any remaining provider steps before we mark this booking as paid.',
                )
              } catch {
                navigate(
                  buildPaymentResultPath('failed', {
                    tourId: checkout.tourId,
                    scheduleId: checkout.scheduleId,
                  }),
                )
              }
            }}
          >
            Pay now
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate(checkout.checkoutPath)}
          >
            Back to checkout
          </Button>
        </div>
      </div>
      <div className="lg:sticky lg:top-24">
        <PaymentSummarySection
          amount={checkout.totalAmount}
          tourName={checkout.tourName}
          scheduleLabel={checkout.scheduleLabel}
          travelerLabel={checkout.travelerLabel}
          isLoading={checkout.detailQuery.isPending || checkout.travelersQuery.isPending}
        />
      </div>
    </div>
  )
}

export default PaymentPage
