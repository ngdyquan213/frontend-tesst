import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useBookingsQuery } from '@/features/bookings/queries/useBookingsQuery'
import { useCreateRefundRequestMutation } from '@/features/refunds/queries/useCreateRefundRequestMutation'
import { useRefundsQuery } from '@/features/refunds/queries/useRefundsQuery'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'

export const RefundRequestForm = () => {
  const [bookingId, setBookingId] = useState('')
  const [reason, setReason] = useState('')
  const bookingsQuery = useBookingsQuery()
  const refundsQuery = useRefundsQuery()
  const mutation = useCreateRefundRequestMutation()
  const { pushToast } = useToast()

  const activeRefundBookingIds = useMemo(
    () =>
      new Set(
        (refundsQuery.data ?? [])
          .filter((refund) => refund.bookingId && refund.status !== 'failed' && refund.status !== 'cancelled')
          .map((refund) => refund.bookingId),
      ),
    [refundsQuery.data],
  )

  const eligibleBookings = useMemo(
    () =>
      (bookingsQuery.data ?? []).filter((booking) => {
        const normalizedPaymentStatus = booking.paymentStatus?.trim().toLowerCase()
        const isPaid = normalizedPaymentStatus ? normalizedPaymentStatus === 'paid' : true

        return (
          isPaid &&
          booking.status !== 'cancelled' &&
          !activeRefundBookingIds.has(booking.id)
        )
      }),
    [activeRefundBookingIds, bookingsQuery.data],
  )

  useEffect(() => {
    const hasSelectedBooking = eligibleBookings.some((booking) => booking.id === bookingId)

    if (hasSelectedBooking) {
      return
    }

    if (eligibleBookings.length > 0) {
      setBookingId(eligibleBookings[0].id)
    } else if (bookingId) {
      setBookingId('')
    }
  }, [bookingId, eligibleBookings])

  return (
    <Card>
      {bookingsQuery.isError ? (
        <Alert tone="danger">We could not load your bookings for refund eligibility right now.</Alert>
      ) : null}
      {refundsQuery.isError ? (
        <Alert tone="danger">We could not verify your existing refund requests right now.</Alert>
      ) : null}
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!bookingId) {
            return
          }

          await mutation.mutateAsync({ bookingId, reason })
          setBookingId('')
          setReason('')
          pushToast('Refund request created.', 'success')
        }}
      >
        <FormField
          label="Booking"
          hint="Only paid bookings without an open refund request appear here."
        >
          {bookingsQuery.isPending || refundsQuery.isPending ? (
            <Alert tone="info">Loading eligible bookings...</Alert>
          ) : eligibleBookings.length === 0 ? (
            <Alert tone="info">
              No paid bookings are currently eligible for a new refund request.
            </Alert>
          ) : (
            <Select value={bookingId} onChange={(event) => setBookingId(event.target.value)}>
              {eligibleBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.reference} · {booking.total} {booking.currency ?? 'USD'}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Reason">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!bookingId || reason.trim().length < 10 || bookingsQuery.isPending || refundsQuery.isPending}
        >
          Submit request
        </Button>
      </form>
    </Card>
  )
}
