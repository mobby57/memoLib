"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { io, Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"

interface WorkspaceNotification {
  id: string
  type: 'workspace-created' | 'workspace-updated' | 'document-uploaded' | 'deadline-alert' | 'checklist-completed'
  workspaceId: string
  workspaceTitle: string
  message: string
  timestamp: Date
  userId?: string
}

export function useWorkspaceNotifications() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user) return

    // Initialize Socket.IO client
    const socketInstance = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected')
      
      // Join tenant room
      const tenantId = (session.user as any).tenantId
      if (tenantId) {
        socketInstance.emit('join-tenant', tenantId)
      }
    })

    // Listen for workspace notifications
    socketInstance.on('workspace-created', (data: WorkspaceNotification) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: "Nouveau dossier créé",
        description: data.workspaceTitle,
        variant: "default",
      })
    })

    socketInstance.on('workspace-updated', (data: WorkspaceNotification) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: "Dossier mis à jour",
        description: data.message,
        variant: "default",
      })
    })

    socketInstance.on('document-uploaded', (data: WorkspaceNotification) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: "Nouveau document",
        description: `Document ajouté à ${data.workspaceTitle}`,
        variant: "default",
      })
    })

    socketInstance.on('deadline-alert', (data: WorkspaceNotification) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: "⚠️ Alerte délai",
        description: data.message,
        variant: "destructive",
      })
    })

    socketInstance.on('checklist-completed', (data: WorkspaceNotification) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: "✓ Tâche complétée",
        description: data.message,
        variant: "default",
      })
    })

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session, toast])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const emitWorkspaceUpdate = useCallback((workspaceId: string, message: string) => {
    if (socket) {
      socket.emit('workspace-updated', {
        workspaceId,
        message,
        timestamp: new Date(),
      })
    }
  }, [socket])

  return {
    socket,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    emitWorkspaceUpdate,
  }
}
