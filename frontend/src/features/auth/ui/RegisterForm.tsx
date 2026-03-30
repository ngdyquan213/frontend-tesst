import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useRegisterMutation } from '@/features/auth/queries/useRegisterMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const RegisterForm = () => {
  const mutation = useRegisterMutation()
  const { pushToast } = useToast()
  const [name, setName] = useState('Taylor Morgan')
  const [email, setEmail] = useState('taylor@travelbook.com')
  const [password, setPassword] = useState('travel123')

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        await mutation.mutateAsync({ name, email, password })
        pushToast('Account created. You can now sign in.', 'success')
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Create account</h1>
        <p className="mt-2 text-on-surface-variant">Keep the same visual language while turning static pages into a working app.</p>
      </div>
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

