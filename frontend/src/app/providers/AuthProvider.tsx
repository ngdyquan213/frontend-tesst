import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { tokenStorage } from '@/shared/storage/token.storage'
import { userStorage } from '@/shared/storage/user.storage'
import { users } from '@/shared/api/mockData'
import type { AppUser } from '@/shared/types/common'

interface LoginPayload {
  email: string
  password?: string
}

interface AuthContextValue {
  user: AppUser | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<AppUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AppUser | null>(userStorage.get())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async ({ email }) => {
        const nextUser = email.includes('admin') ? users.admin : users.traveler
        tokenStorage.set(`token-${nextUser.id}`)
        userStorage.set(nextUser)
        setUser(nextUser)
        return nextUser
      },
      logout: () => {
        tokenStorage.clear()
        userStorage.clear()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
