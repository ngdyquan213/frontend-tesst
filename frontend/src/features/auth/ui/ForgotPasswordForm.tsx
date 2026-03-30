import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useForgotPasswordMutation } from '@/features/auth/queries/useForgotPasswordMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('alex@travelbook.com')
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
      <FormField label="Email">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} />
      </FormField>
      <Button className="w-full" type="submit">
        Send reset link
      </Button>
    </form>
  )
}

