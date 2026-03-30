import { useToast } from '@/app/providers/ToastProvider'
import { useVoucherDownloadMutation } from '@/features/vouchers/queries/useVoucherDownloadMutation'
import { Button } from '@/shared/ui/Button'

export const VoucherDownloadButton = ({ voucherId }: { voucherId: string }) => {
  const mutation = useVoucherDownloadMutation()
  const { pushToast } = useToast()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await mutation.mutateAsync(voucherId)
        pushToast('Voucher download started.', 'success')
      }}
    >
      Download
    </Button>
  )
}

