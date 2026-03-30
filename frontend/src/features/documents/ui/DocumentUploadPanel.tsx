import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useUploadDocumentMutation } from '@/features/documents/queries/useUploadDocumentMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

export const DocumentUploadPanel = () => {
  const [title, setTitle] = useState('')
  const mutation = useUploadDocumentMutation()
  const { pushToast } = useToast()

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!title.trim()) return
          await mutation.mutateAsync({ title })
          setTitle('')
          pushToast('Document uploaded.', 'success')
        }}
      >
        <FormField label="Document title">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <Button type="submit">Upload document</Button>
      </form>
    </Card>
  )
}

