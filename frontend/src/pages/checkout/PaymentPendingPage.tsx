import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildPaymentResultPath } from '@/app/router/routePaths'
import { clearStoredCheckoutIdempotencyKey } from '@/features/payments/lib/paymentCheckout'
import { usePaymentStatusQuery } from '@/features/payments/queries/usePaymentStatusQuery'
import { PaymentStatusPanel } from '@/features/payments/ui/PaymentStatusPanel'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

function isTerminalStatus(status?: 'pending' | 'processing' | 'success' | 'failed') {
  return status === 'success' || status === 'failed'
}

const PaymentPendingPage = () => {
  const navigate = useNavigate()
  const checkout = useCheckoutContext()
  const paymentStatusQuery = usePaymentStatusQuery(checkout.paymentId, {
    refetchInterval: 3_000,
  })
  const paymentStatus = paymentStatusQuery.data?.status ?? 'processing'

  useEffect(() => {
    if (!isTerminalStatus(paymentStatusQuery.data?.status)) {
      return
    }

    if (checkout.tourId && checkout.scheduleId && paymentStatusQuery.data?.methodId) {
      clearStoredCheckoutIdempotencyKey({
        methodId: paymentStatusQuery.data.methodId,
        tourId: checkout.tourId,
        scheduleId: checkout.scheduleId,
        travelerCounts: checkout.travelerCounts,
        travelDate:
          checkout.selectedSchedule?.departure_date ?? new Date().toISOString().slice(0, 10),
      })
    }

    navigate(
      buildPaymentResultPath(
        paymentStatusQuery.data.status === 'success' ? 'success' : 'failed',
        {
          tourId: checkout.tourId,
          scheduleId: checkout.scheduleId,
          bookingId: checkout.bookingId,
          paymentId: checkout.paymentId,
          adultCount: checkout.travelerCounts.adultCount,
          childCount: checkout.travelerCounts.childCount,
          infantCount: checkout.travelerCounts.infantCount,
        },
      ),
      { replace: true },
    )
  }, [
    checkout.bookingId,
    checkout.paymentId,
    checkout.scheduleId,
    checkout.selectedSchedule?.departure_date,
    checkout.tourId,
    checkout.travelerCounts,
    navigate,
    paymentStatusQuery.data,
  ])

  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mb-4 text-5xl text-secondary">...</div>
      <h1 className="text-3xl font-extrabold text-primary">Payment pending</h1>
      <p className="mt-3 text-on-surface-variant">
        Your {checkout.tourName} booking has been reserved and we are waiting for the payment to
        reach a final status. Keep this page open while we check for confirmation.
      </p>
      <div className="mt-6">
        <PaymentStatusPanel status={paymentStatus} />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => paymentStatusQuery.refetch()}>
          Check again
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(checkout.checkoutPath)}>
          Back to checkout
        </Button>
      </div>
    </Card>
  )
}

export default PaymentPendingPage
