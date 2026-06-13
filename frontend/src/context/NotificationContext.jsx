import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import api from '@/api/axios'
import { useAuth } from '@/hooks/useAuth'

export const NotificationContext = createContext(null)

const POLL_INTERVAL = 30_000 // 30 seconds

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const intervalRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch { /* silently ignore */ }
  }, [isAuthenticated])

  const markRead = useCallback(async (id) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnreadCount(0)
  }, [])

  const markReadByReservation = useCallback((reservationId) => {
    const rid = Number(reservationId)
    setNotifications(prev => {
      const unread = prev.filter(n => !n.read_at && n.reservation_id === rid)
      if (unread.length === 0) return prev
      const now = new Date().toISOString()
      unread.forEach(n => api.put(`/notifications/${n.id}/read`).catch(() => {}))
      setUnreadCount(c => Math.max(0, c - unread.length))
      return prev.map(n => unread.some(u => u.id === n.id) ? { ...n, read_at: now } : n)
    })
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [isAuthenticated, fetchNotifications])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead, markReadByReservation }}>
      {children}
    </NotificationContext.Provider>
  )
}
