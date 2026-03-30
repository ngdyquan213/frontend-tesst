import type { AppUser } from '@/shared/types/common'

const USER_KEY = 'travelbook_user'

export const userStorage = {
  get: (): AppUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AppUser) : null
  },
  set: (value: AppUser) => localStorage.setItem(USER_KEY, JSON.stringify(value)),
  clear: () => localStorage.removeItem(USER_KEY),
}

