import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@/api/axios'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'cabs_token'
const USER_KEY  = 'cabs_user'

const IDLE_TIMEOUT_MS = (Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 30) * 60_000
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)

  const isAuthenticated = Boolean(token && user)

  // Persist to localStorage whenever they change
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else       localStorage.removeItem(TOKEN_KEY)
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else      localStorage.removeItem(USER_KEY)
  }, [user])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed.'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', payload)
      setToken(data.token)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (err) {
      const errors  = err.response?.data?.errors  || null
      const message = err.response?.data?.message || 'Registration failed.'
      return { success: false, message, errors }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/user')
      setUser(data)
    } catch { logout() }
  }, [logout])

  // Auto-logout after IDLE_TIMEOUT_MS of no user activity
  const idleTimerRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS)
    }

    resetIdleTimer()
    IDLE_EVENTS.forEach((event) => window.addEventListener(event, resetIdleTimer))

    return () => {
      clearTimeout(idleTimerRef.current)
      IDLE_EVENTS.forEach((event) => window.removeEventListener(event, resetIdleTimer))
    }
  }, [isAuthenticated, logout])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin:       user?.role === 'administrator',
    isStaff:       user?.role === 'staff',
    isClient:      user?.role === 'client',
    isAdminOrStaff: ['administrator', 'staff'].includes(user?.role),
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, loading, isAuthenticated, login, register, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
