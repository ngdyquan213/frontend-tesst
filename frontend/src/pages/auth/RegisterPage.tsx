import { Link } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/ui/RegisterForm'

const RegisterPage = () => (
  <div className="space-y-6">
    <RegisterForm />
    <div className="text-sm text-on-surface-variant">
      Already have an account? <Link className="font-semibold text-primary" to="/auth/login">Sign in</Link>
    </div>
  </div>
)

export default RegisterPage

