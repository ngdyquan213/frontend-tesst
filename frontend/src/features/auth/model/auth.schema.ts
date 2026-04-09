import { z } from 'zod'
import { VALIDATION } from '@/shared/constants/constants'

const passwordPolicySchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
  .regex(/\d/, 'Password must include at least one number.')

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(
      VALIDATION.PASSWORD_MIN_LENGTH,
      `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters.`,
    ),
})

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION.NAME_MIN_LENGTH, 'Please enter your full name.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  password: passwordPolicySchema,
})

type LoginField = keyof z.input<typeof loginSchema>
type RegisterField = keyof z.input<typeof registerSchema>

function getFieldErrors<TField extends string>(
  error: z.ZodError,
): Partial<Record<TField, string>> {
  const fieldErrors = error.flatten().fieldErrors
  const errors: Partial<Record<TField, string>> = {}

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const firstMessage = Array.isArray(messages) ? messages[0] : undefined
    if (typeof firstMessage === 'string') {
      errors[field as TField] = firstMessage
    }
  }

  return errors
}

export function validateLoginPayload(payload: z.input<typeof loginSchema>) {
  const result = loginSchema.safeParse(payload)

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
      errors: {} as Partial<Record<LoginField, string>>,
    }
  }

  return {
    success: false as const,
    errors: getFieldErrors<LoginField>(result.error),
  }
}

export function validateRegisterPayload(payload: z.input<typeof registerSchema>) {
  const result = registerSchema.safeParse(payload)

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
      errors: {} as Partial<Record<RegisterField, string>>,
    }
  }

  return {
    success: false as const,
    errors: getFieldErrors<RegisterField>(result.error),
  }
}
