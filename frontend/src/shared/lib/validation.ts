import { VALIDATION } from '@/shared/constants/constants'

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email is required' }
  if (!VALIDATION.EMAIL_PATTERN.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'Password is required' }
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` }
  }
  return { valid: true }
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Name is required' }
  if (name.length < VALIDATION.NAME_MIN_LENGTH) {
    return { valid: false, error: `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters` }
  }
  return { valid: true }
}

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: false, error: 'Phone number is required' }
  if (!VALIDATION.PHONE_PATTERN.test(phone.replace(/\D/g, ''))) {
    return { valid: false, error: 'Invalid phone number' }
  }
  return { valid: true }
}

export function validatePassport(passport: string): { valid: boolean; error?: string } {
  if (!passport) return { valid: false, error: 'Passport number is required' }
  if (passport.length < 6) {
    return { valid: false, error: 'Passport number is invalid' }
  }
  return { valid: true }
}

export function validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  if (startDate >= endDate) {
    return { valid: false, error: 'End date must be after start date' }
  }
  return { valid: true }
}

export function validatePassengerCount(count: number): { valid: boolean; error?: string } {
  if (count < 1) return { valid: false, error: 'At least 1 passenger is required' }
  if (count > 9) return { valid: false, error: 'Maximum 9 passengers allowed' }
  return { valid: true }
}
