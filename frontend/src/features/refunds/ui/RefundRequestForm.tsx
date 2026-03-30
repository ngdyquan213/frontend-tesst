import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useCreateRefundRequestMutation } from '@/features/refunds/queries/useCreateRefundRequestMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Textarea } from '@/shared/ui/Textarea'

export const RefundRequestForm = () => {
  const [reason, setReason] = useState('')
  const mutation = useCreateRefundRequestMutation()
  const { pushToast } = useToast()

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          await mutation.mutateAsync({ reason })
          setReason('')
          pushToast('Refund request created.', 'success')
        }}
      >
        <FormField label="Reason">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
        <Button type="submit">Submit request</Button>
      </form>
    </Card>
  )
}

