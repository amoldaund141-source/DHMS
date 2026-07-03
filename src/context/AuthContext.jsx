import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('dhms_token')
      const storedUser  = localStorage.getItem('dhms_user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch {
      localStorage.removeItem('dhms_token')
      localStorage.removeItem('dhms_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('dhms_token', newToken)
    localStorage.setItem('dhms_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dhms_token')
    localStorage.removeItem('dhms_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
