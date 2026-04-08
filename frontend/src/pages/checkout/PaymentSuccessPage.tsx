import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
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
  const paymentStatus = paymentStatusQuery.data?.status ?? 'success'
  const heading = paymentStatus === 'success' ? 'Payment successful' : 'Payment initiated'
  const description =
    paymentStatus === 'success'
      ? `Your ${checkout.tourName} departure is confirmed and payment has been recorded successfully.`
      : `Your ${checkout.tourName} departure is reserved and the payment request has been created successfully.`

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
