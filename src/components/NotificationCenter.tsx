"use client"

import { useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  type Notification,
} from '@/lib/services/collaborationService'
import { Button } from './forms/Button'
import Link from 'next/link'

interface NotificationCenterProps {
  userId: string
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  useEffect(() => {
    loadNotifications()
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId, showUnreadOnly])

  const loadNotifications = () => {
    const notifs = getNotifications(userId, showUnreadOnly)
    setNotifications(notifs)
    setUnreadCount(getUnreadNotificationsCount(userId))
  }

  const handleMarkAsRead = (notifId: string) => {
    markNotificationAsRead(notifId)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(userId)
    loadNotifications()
  }

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      mention: '💬',
      comment: '💬',
      assignment: '👤',
      status_change: '🔄',
      deadline: '⏰',
      system: 'ℹ️',
    }
    return icons[type]
  }

  const getNotificationColor = (type: Notification['type']) => {
    const colors = {
      mention: 'text-blue-600 dark:text-blue-400',
      comment: 'text-purple-600 dark:text-purple-400',
      assignment: 'text-green-600 dark:text-green-400',
      status_change: 'text-orange-600 dark:text-orange-400',
      deadline: 'text-red-600 dark:text-red-400',
      system: 'text-gray-600 dark:text-gray-400',
    }
    return colors[type]
  }

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel des notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    showUnreadOnly
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Non lues ({unreadCount})
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {showUnreadOnly
                    ? 'Aucune notification non lue'
                    : 'Aucune notification'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${getNotificationColor(notif.type)}`}>
                                {notif.title}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {!notif.read && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="flex-shrink-0 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title="Marquer comme lu"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {notif.link && (
                            <Link
                              href={notif.link}
                              onClick={() => {
                                handleMarkAsRead(notif.id)
                                setIsOpen(false)
                              }}
                              className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Voir →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
