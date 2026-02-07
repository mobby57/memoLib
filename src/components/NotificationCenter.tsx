'use client'

/**
 * Real-Time Notification Center
 * - Displays WebSocket notifications
 * - Email arrivals, dossier updates, deadline alerts
 * - Browser notifications support
 * - Mark as read / clear functionality
 */

import { useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Bell, Mail, Briefcase, AlertTriangle, Info, X, Check, Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function NotificationCenter() {
  const {
    connected,
    connecting,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    clearNotificationType,
    requestNotificationPermission,
    hasUnread,
  } = useWebSocket({ debug: true })

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'emails' | 'dossiers' | 'deadlines' | 'system'>('all')

  // Connection status badge
  const statusBadge = connecting ? (
    <span className="absolute -top-1 -right-1 flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
    </span>
  ) : connected ? (
    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500"></span>
  ) : (
    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
  )

  // Get notifications for active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'emails':
        return notifications.emails
      case 'dossiers':
        return notifications.dossiers
      case 'deadlines':
        return notifications.deadlines
      case 'system':
        return notifications.system
      default:
        return [
          ...notifications.emails.map(n => ({ ...n, category: 'email' as const })),
          ...notifications.dossiers.map(n => ({ ...n, category: 'dossier' as const })),
          ...notifications.deadlines.map(n => ({ ...n, category: 'deadline' as const })),
          ...notifications.system.map(n => ({ ...n, category: 'system' as const })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className={`w-5 h-5 ${hasUnread ? 'text-blue-600 animate-bounce' : 'text-gray-600'}`} />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {statusBadge}
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-2">
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-x-0 bottom-0 lg:absolute lg:inset-auto lg:w-96 bg-white rounded-t-2xl lg:rounded-lg shadow-2xl border border-gray-200 max-h-[80vh] lg:max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <div className={`text-xs px-2 py-0.5 rounded-full ${
                  connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {connecting ? 'Connexion...' : connected ? 'En direct' : 'Deconnecte'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => requestNotificationPermission()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                  title="Activer les notifications navigateur"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { id: 'all', label: 'Tout', count: unreadCount },
                { id: 'emails', label: 'Emails', count: notifications.emails.length },
                { id: 'dossiers', label: 'Dossiers', count: notifications.dossiers.length },
                { id: 'deadlines', label: 'Delais', count: notifications.deadlines.length },
                { id: 'system', label: 'Systeme', count: notifications.system.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Bell className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification: any, index) => (
                    <NotificationItem
                      key={`${notification.id}-${index}`}
                      notification={notification}
                      onMarkRead={() => markAsRead(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <button
                  onClick={() => activeTab === 'all' ? clearNotifications() : clearNotificationType(activeTab)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Tout effacer
                </button>
                <span className="text-xs text-gray-500">
                  {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Individual notification item component
function NotificationItem({ notification, onMarkRead }: { notification: any; onMarkRead: () => void }) {
  const getIcon = () => {
    switch (notification.type || notification.category) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-500" />
      case 'dossier':
        return <Briefcase className="w-5 h-5 text-green-500" />
      case 'deadline':
        const urgencyColor = {
          critical: 'text-red-500',
          urgent: 'text-orange-500',
          warning: 'text-yellow-500',
          info: 'text-blue-500',
        }
        return <AlertTriangle className={`w-5 h-5 ${urgencyColor[notification.urgency as keyof typeof urgencyColor] || 'text-gray-500'}`} />
      case 'system':
        return <Info className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getContent = () => {
    switch (notification.type || notification.category) {
      case 'email':
        return (
          <>
            <div className="font-medium text-sm">{notification.subject}</div>
            <div className="text-xs text-gray-600">De: {notification.from}</div>
            {notification.dossierNumber && (
              <div className="text-xs text-blue-600 mt-1">Dossier #{notification.dossierNumber}</div>
            )}
          </>
        )
      case 'dossier':
        return (
          <>
            <div className="font-medium text-sm">{notification.dossierTitle}</div>
            <div className="text-xs text-gray-600">
              {notification.action === 'created' && 'Nouveau dossier cree'}
              {notification.action === 'updated' && 'Dossier mis a jour'}
              {notification.action === 'status_changed' && `Statut: ${notification.status}`}
              {notification.action === 'document_added' && 'Document ajoute'}
            </div>
            <div className="text-xs text-blue-600 mt-1">#{notification.dossierNumber}</div>
          </>
        )
      case 'deadline':
        return (
          <>
            <div className="font-medium text-sm">{notification.message}</div>
            <div className="text-xs text-gray-600">
              Dossier #{notification.dossierNumber} - {notification.remainingDays} jour{notification.remainingDays > 1 ? 's' : ''} restant{notification.remainingDays > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-orange-600 mt-1">{notification.deadlineType}</div>
          </>
        )
      case 'system':
        return (
          <>
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="text-xs text-gray-600">{notification.message}</div>
          </>
        )
      default:
        return <div className="text-sm text-gray-600">Notification</div>
    }
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors group">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {getContent()}
          <div className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
              locale: fr,
            })}
          </div>
        </div>
        <button
          onClick={onMarkRead}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
          title="Marquer comme lu"
        >
          <Check className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
