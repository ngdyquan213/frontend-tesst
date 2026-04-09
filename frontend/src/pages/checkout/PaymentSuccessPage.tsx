import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPaymentResultPath } from '@/app/router/routePaths'
import { clearStoredCheckoutIdempotencyKey } from '@/features/payments/lib/paymentCheckout'
import { usePaymentStatusQuery } from '@/features/payments/queries/usePaymentStatusQuery'
import { PaymentStatusPanel } from '@/features/payments/ui/PaymentStatusPanel'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const checkout = useCheckoutContext()
  const paymentStatusQuery = usePaymentStatusQuery(checkout.paymentId)
  const bookingTarget = isAuthenticated
    ? checkout.bookingId
      ? `/account/bookings/${checkout.bookingId}`
      : '/account/bookings'
    : '/auth/login'

  useEffect(() => {
    const status = paymentStatusQuery.data?.status

    if (!status || status === 'success') {
      if (
        status === 'success' &&
        checkout.tourId &&
        checkout.scheduleId &&
        paymentStatusQuery.data?.methodId
      ) {
        clearStoredCheckoutIdempotencyKey({
          methodId: paymentStatusQuery.data.methodId,
          tourId: checkout.tourId,
          scheduleId: checkout.scheduleId,
          travelerCounts: checkout.travelerCounts,
          travelDate:
            checkout.selectedSchedule?.departure_date ?? new Date().toISOString().slice(0, 10),
        })
      }

      return
    }

    navigate(
      buildPaymentResultPath(status === 'failed' ? 'failed' : 'pending', {
        tourId: checkout.tourId,
        scheduleId: checkout.scheduleId,
        bookingId: checkout.bookingId,
        paymentId: checkout.paymentId,
        adultCount: checkout.travelerCounts.adultCount,
        childCount: checkout.travelerCounts.childCount,
        infantCount: checkout.travelerCounts.infantCount,
      }),
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

  const paymentStatus = paymentStatusQuery.data?.status ?? 'processing'
  const heading = paymentStatus === 'success' ? 'Payment successful' : 'Payment status updating'
  const description =
    paymentStatus === 'success'
      ? `Your ${checkout.tourName} departure is confirmed and payment has been recorded successfully.`
      : `Your ${checkout.tourName} departure is reserved while we confirm the payment outcome with the backend.`

  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mb-4 text-5xl text-secondary">✓</div>
      <h1 className="text-3xl font-extrabold text-primary">{heading}</h1>
      <p className="mt-3 text-on-surface-variant">{description}</p>
      <div className="mt-6">
        <PaymentStatusPanel status={paymentStatus} />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          onClick={() => navigate(bookingTarget)}
        >
          {isAuthenticated ? 'Open booking' : 'Sign in to manage booking'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          Back home
        </Button>
      </div>
    </Card>
  )
}

export default PaymentSuccessPage
