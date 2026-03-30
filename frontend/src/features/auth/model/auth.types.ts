import type { AppUser } from '@/shared/types/common'

export interface LoginFormValues {
  email: string
  password: string
}

export interface RegisterFormValues {
  name: string
  email: string
  password: string
}

export type AuthUser = AppUser

