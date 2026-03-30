import { useToast } from '@/app/providers/ToastProvider'
import { useCancelBookingMutation } from '@/features/bookings/queries/useCancelBookingMutation'
import { Button } from '@/shared/ui/Button'

export const BookingActions = ({ bookingId }: { bookingId: string }) => {
  const mutation = useCancelBookingMutation()
  const { pushToast } = useToast()

  return (
    <Button
      onClick={async () => {
        await mutation.mutateAsync(bookingId)
        pushToast('Booking cancelled.', 'warning')
      }}
      variant="outline"
    >
      Cancel booking
    </Button>
  )
}

