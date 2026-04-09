import { env } from '@/app/config/env'

export function isMockApiEnabled() {
  return env.enableMocks
}
