'use client'

/**
 * React Hook for WebSocket Real-Time Notifications
 * - Auto-connects on mount
 * - Auto-reconnects on disconnect
 * - Listens for email, dossier, deadline, and system notifications
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import type {
  EmailNotification,
  DossierNotification,
  DeadlineAlert,
  SystemNotification,
} from '@/lib/websocket'

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnect?: boolean
  reconnectDelay?: number
  debug?: boolean
}

interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  clientsCount: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnect = true,
    reconnectDelay = 3000,
    debug = false,
  } = options

  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    clientsCount: 0,
  })

  const [notifications, setNotifications] = useState<{
    emails: EmailNotification[]
    dossiers: DossierNotification[]
    deadlines: DeadlineAlert[]
    system: SystemNotification[]
  }>({
    emails: [],
    dossiers: [],
    deadlines: [],
    system: [],
  })

  const [unreadCount, setUnreadCount] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Logger
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[useWebSocket]', ...args)
    }
  }, [debug])

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!session?.user || state.connecting || state.connected) {
      return
    }

    setState(prev => ({ ...prev, connecting: true, error: null }))
    log('Connecting...')

    try {
      const newSocket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: reconnect,
        reconnectionDelay: reconnectDelay,
        reconnectionAttempts: 5,
      })

      // Connection events
      newSocket.on('connect', () => {
        log('Connected:', newSocket.id)
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }))

        // Join user's tenant room
        if (session.user.tenantId) {
          newSocket.emit('join-tenant', session.user.tenantId)
          log('Joined tenant:', session.user.tenantId)
        }
      })

      newSocket.on('disconnect', (reason: string) => {
        log('Disconnected:', reason)
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }))

        // Auto-reconnect if disconnected unexpectedly
        if (reconnect && reason === 'io server disconnect') {
          reconnectTimeoutRef.current = setTimeout(() => {
            log('Attempting to reconnect...')
            newSocket.connect()
          }, reconnectDelay)
        }
      })

      newSocket.on('connect_error', (error: Error) => {
        log('Connection error:', error.message)
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message,
        }))
      })

      // Notification event listeners
      newSocket.on('email-received', (data: EmailNotification) => {
        log('Email received:', data)
        setNotifications(prev => ({
          ...prev,
          emails: [data, ...prev.emails].slice(0, 50), // Keep last 50
        }))
        setUnreadCount(prev => prev + 1)

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nouvel email', {
            body: `De: ${data.from}\n${data.subject}`,
            icon: '/icons/email.png',
            badge: '/icons/badge.png',
          })
        }
      })

      newSocket.on('dossier-updated', (data: DossierNotification) => {
        log('Dossier updated:', data)
        setNotifications(prev => ({
          ...prev,
          dossiers: [data, ...prev.dossiers].slice(0, 50),
        }))
        setUnreadCount(prev => prev + 1)
      })

      newSocket.on('deadline-alert', (data: DeadlineAlert) => {
        log('Deadline alert:', data)
        setNotifications(prev => ({
          ...prev,
          deadlines: [data, ...prev.deadlines].slice(0, 20),
        }))
        setUnreadCount(prev => prev + 1)

        // Browser notification for critical deadlines
        if (data.urgency === 'critical' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('️ Delai critique', {
            body: data.message,
            icon: '/icons/alert.png',
            requireInteraction: true,
          })
        }
      })

      newSocket.on('system-notification', (data: SystemNotification) => {
        log('System notification:', data)
        setNotifications(prev => ({
          ...prev,
          system: [data, ...prev.system].slice(0, 20),
        }))
        setUnreadCount(prev => prev + 1)
      })

      newSocket.on('notification-count', (count: number) => {
        log('Notification count updated:', count)
        setUnreadCount(count)
      })

      setSocket(newSocket)
    } catch (error) {
      log('Error creating socket:', error)
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [session, state.connecting, state.connected, reconnect, reconnectDelay, log])

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socket) {
      log('Disconnecting...')
      socket.disconnect()
      setSocket(null)
      setState({
        connected: false,
        connecting: false,
        error: null,
        clientsCount: 0,
      })
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [socket, log])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (socket && state.connected) {
      socket.emit('mark-notification-read', notificationId)
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [socket, state.connected])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications({
      emails: [],
      dossiers: [],
      deadlines: [],
      system: [],
    })
    setUnreadCount(0)
  }, [])

  // Clear specific type of notifications
  const clearNotificationType = useCallback((type: 'emails' | 'dossiers' | 'deadlines' | 'system') => {
    setNotifications(prev => ({
      ...prev,
      [type]: [],
    }))
  }, [])

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      log('Notification permission:', permission)
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [log])

  // Auto-connect on mount if authenticated
  useEffect(() => {
    if (autoConnect && status === 'authenticated' && !state.connected && !state.connecting) {
      connect()
    }

    return () => {
      if (socket) {
        disconnect()
      }
    }
  }, [autoConnect, status, connect, disconnect])

  return {
    // State
    socket,
    ...state,
    notifications,
    unreadCount,

    // Actions
    connect,
    disconnect,
    markAsRead,
    clearNotifications,
    clearNotificationType,
    requestNotificationPermission,

    // Helpers
    hasUnread: unreadCount > 0,
    isReady: state.connected && !state.connecting,
  }
}

export type { EmailNotification, DossierNotification, DeadlineAlert, SystemNotification }
