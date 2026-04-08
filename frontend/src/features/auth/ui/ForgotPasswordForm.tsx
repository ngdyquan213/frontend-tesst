import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/app/providers/ToastProvider'
import { useForgotPasswordMutation } from '@/features/auth/queries/useForgotPasswordMutation'
import { Alert } from '@/shared/ui/Alert'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const mutation = useForgotPasswordMutation()
  const { pushToast } = useToast()

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        await mutation.mutateAsync({ email })
        pushToast('Reset instructions sent to your inbox.', 'success')
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Forgot password</h1>
        <p className="mt-2 text-on-surface-variant">We will email you a secure reset link.</p>
      </div>
      {mutation.isError ? <Alert tone="danger">{mutation.error.message}</Alert> : null}
      <FormField label="Email">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} />
      </FormField>
      <Button className="w-full" type="submit" loading={mutation.isPending} disabled={email.trim().length === 0}>
        Send reset link
      </Button>
      <Link className="inline-flex text-sm font-semibold text-secondary" to="/auth/login">
        Back to login
      </Link>
    </form>
  )
}
