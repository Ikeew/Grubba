import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@/types/auth'
import { authService } from '@/services/auth.service'
import { queryClient } from '@/lib/queryClient'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setIsLoading(false)
      return
    }
    authService
      .getMe()
      .then(setUser)
      .catch(() => authService.clearTokens())
      .finally(() => setIsLoading(false))
  }, [])

  function logout() {
    authService.clearTokens()
    setUser(null)
    queryClient.clear()
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
