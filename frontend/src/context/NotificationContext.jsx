import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { createWebSocket } from '../api/websocket'
import NotificationToast from '../components/NotificationToast'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [toasts, setToasts] = useState([])
  const wsRef = useRef(null)

  // Auto-connect mechanic to the global requests channel to receive "new_request" events
  useEffect(() => {
    if (user?.role === 'mechanic') {
      wsRef.current = createWebSocket('ws/requests/', {
        new_request: (data) => {
          showNotification(
            'new_request',
            'New Breakdown Request! 🚨',
            `${data.request.vehicle_make} is stranded nearby.`
          )
        },
      })
    }
    
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [user])

  const showNotification = useCallback((type, title, message) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type, title, message }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
