import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { User } from '../lib/models/User'
import { authService } from '../lib/services/authService'

type AuthState = {
  token: string | null
  user: User | null
  loading: boolean
  setToken: (token: string | null) => void
  refreshMe: (overrideToken?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const TOKEN_KEY = 'sellor_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const setToken = (next: string | null) => {
    setTokenState(next)
    if (next) localStorage.setItem(TOKEN_KEY, next)
    else localStorage.removeItem(TOKEN_KEY)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const refreshMe = async (overrideToken?: string) => {
    const activeToken = overrideToken || token
    if (!activeToken) {
      setUser(null)
      return
    }
    try {
      const u = await authService.me(activeToken)
      setUser(User.fromDto(u))
    } catch {
      // token invalid/expired or server mismatch
      logout()
    }
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await refreshMe()
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthState>(
    () => ({ token, user, loading, setToken, refreshMe, logout }),
    [token, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

