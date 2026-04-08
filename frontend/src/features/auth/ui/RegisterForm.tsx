import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/app/providers/ToastProvider'
import { useRegisterMutation } from '@/features/auth/queries/useRegisterMutation'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const RegisterForm = () => {
  const mutation = useRegisterMutation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        await mutation.mutateAsync({ name, email, password })
        pushToast('Account created and signed in.', 'success')
        navigate('/account')
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Create account</h1>
        <p className="mt-2 text-on-surface-variant">
          Set up your traveler profile once, then manage bookings and trip updates in one place.
        </p>
      </div>
      {mutation.isError ? <Alert tone="danger">{mutation.error.message}</Alert> : null}
      <FormField label="Full name">
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label="Email">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} />
      </FormField>
      <FormField label="Password">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </FormField>
      <Button className="w-full" type="submit">
        Create account
      </Button>
    </form>
  )
}
