import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useCreateTravelerMutation } from '@/features/travelers/queries/useCreateTravelerMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

export const TravelerForm = () => {
  const [fullName, setFullName] = useState('')
  const mutation = useCreateTravelerMutation()
  const { pushToast } = useToast()

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!fullName.trim()) return
          await mutation.mutateAsync({ fullName })
          setFullName('')
          pushToast('Traveler added.', 'success')
        }}
      >
        <FormField label="Traveler full name">
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </FormField>
        <Button type="submit">Add traveler</Button>
      </form>
    </Card>
  )
}

