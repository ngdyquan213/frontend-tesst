import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useCreateSupportTicketMutation } from '@/features/support/queries/useCreateSupportTicketMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'

export const TicketForm = () => {
  const [subject, setSubject] = useState('Need booking assistance')
  const [body, setBody] = useState('Please confirm the latest transfer timing for my departure.')
  const mutation = useCreateSupportTicketMutation()
  const { pushToast } = useToast()

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          await mutation.mutateAsync({ subject, body })
          pushToast('Support ticket created.', 'success')
        }}
      >
        <FormField label="Subject">
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
        </FormField>
        <FormField label="Message">
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} />
        </FormField>
        <Button type="submit">Send request</Button>
      </form>
    </Card>
  )
}

