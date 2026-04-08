import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { mapApiUserToAppUser } from '@/shared/lib/auth'
import type { AppUser } from '@/shared/types/common'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  name: string
}

interface AuthContextValue {
  user: AppUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (payload: LoginPayload) => Promise<AppUser>
  register: (payload: RegisterPayload) => Promise<AppUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const loginAction = useAuthStore((state) => state.login)
  const registerAction = useAuthStore((state) => state.register)
  const logoutAction = useAuthStore((state) => state.logout)
  const apiUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const hasInitializedRef = useRef(false)
  const user = useMemo(() => (apiUser ? mapApiUserToAppUser(apiUser) : null), [apiUser])

  useEffect(() => {
    if (hasInitializedRef.current) {
      return
    }

    hasInitializedRef.current = true
    void initializeAuth()
  }, [initializeAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: isAuthenticated && Boolean(user),
      isInitializing,
      login: async ({ email, password }) => {
        await loginAction(email, password)
        const nextUser = useAuthStore.getState().user
        if (!nextUser) {
          throw new Error('Unable to load the signed-in account.')
        }
        return mapApiUserToAppUser(nextUser)
      },
      register: async ({ email, password, name }) => {
        await registerAction(email, password, name)
        const nextUser = useAuthStore.getState().user
        if (!nextUser) {
          throw new Error('Unable to load the newly created account.')
        }
        return mapApiUserToAppUser(nextUser)
      },
      logout: async () => logoutAction(),
    }),
    [isAuthenticated, isInitializing, loginAction, logoutAction, registerAction, user],
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
