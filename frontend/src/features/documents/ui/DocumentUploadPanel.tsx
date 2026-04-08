import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useUploadDocumentMutation } from '@/features/documents/queries/useUploadDocumentMutation'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'national_id', label: 'National ID' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
]

export const DocumentUploadPanel = () => {
  const [documentType, setDocumentType] = useState('passport')
  const [file, setFile] = useState<File | null>(null)
  const mutation = useUploadDocumentMutation()
  const { pushToast } = useToast()

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!file) return
          await mutation.mutateAsync({ documentType, file })
          setFile(null)
          pushToast('Document uploaded.', 'success')
        }}
      >
        <Alert tone="info">
          Uploads are now sent to the backend. Supported formats depend on the backend file policy.
        </Alert>
        {mutation.isError ? (
          <Alert tone="danger">
            {mutation.error.message || 'We could not upload this document right now.'}
          </Alert>
        ) : null}
        <FormField label="Document type">
          <Select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="File">
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <Button type="submit" disabled={!file} loading={mutation.isPending}>
          Upload document
        </Button>
      </form>
    </Card>
  )
}
