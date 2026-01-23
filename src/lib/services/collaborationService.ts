"use client"

/**
 * Service de collaboration en temps réel
 * Commentaires, mentions, notifications in-app
 */

import { safeLocalStorage } from '@/lib/localStorage'
import { logger } from '@/lib/logger'

export interface Comment {
  id: string
  dossierId?: string
  clientId?: string
  factureId?: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  mentions: string[] // IDs des utilisateurs mentionnés
  createdAt: Date
  updatedAt: Date
  parentId?: string // Pour les réponses
  attachments?: string[]
  reactions?: Record<string, string[]> // emoji -> userIds
}

export interface Notification {
  id: string
  userId: string
  type: 'mention' | 'comment' | 'assignment' | 'status_change' | 'deadline' | 'system'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
  data?: Record<string, any>
}

export interface Activity {
  id: string
  userId: string
  userName: string
  type: string
  action: string
  target: string
  targetId: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

/**
 * Récupère les commentaires
 */
export function getComments(filters?: {
  dossierId?: string
  clientId?: string
  factureId?: string
}): Comment[] {
  const commentsJson = safeLocalStorage.getItem('comments')
  let comments: Comment[] = commentsJson ? JSON.parse(commentsJson) : []

  // Convertir les dates
  comments = comments.map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }))

  // Appliquer les filtres
  if (filters) {
    if (filters.dossierId) {
      comments = comments.filter(c => c.dossierId === filters.dossierId)
    }
    if (filters.clientId) {
      comments = comments.filter(c => c.clientId === filters.clientId)
    }
    if (filters.factureId) {
      comments = comments.filter(c => c.factureId === filters.factureId)
    }
  }

  return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Ajoute un commentaire
 */
export function addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment {
  const comments = getComments()

  const newComment: Comment = {
    ...comment,
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    reactions: {},
  }

  comments.push(newComment)
  safeLocalStorage.setItem('comments', JSON.stringify(comments))

  // Créer des notifications pour les mentions
  if (comment.mentions.length > 0) {
    comment.mentions.forEach(userId => {
      createNotification({
        userId,
        type: 'mention',
        title: 'Nouvelle mention',
        message: `${comment.userName} vous a mentionné dans un commentaire`,
        link: comment.dossierId
          ? `/dossiers/${comment.dossierId}`
          : comment.factureId
          ? `/factures`
          : undefined,
        data: { commentId: newComment.id },
      })
    })
  }

  logger.info('Commentaire ajouté avec succès', { commentId: newComment.id, dossierId: newComment.dossierId })

  return newComment
}

/**
 * Met à jour un commentaire
 */
export function updateComment(commentId: string, updates: Partial<Comment>): void {
  const commentsJson = safeLocalStorage.getItem('comments')
  if (!commentsJson) return

  const comments = JSON.parse(commentsJson)
  const index = comments.findIndex((c: Comment) => c.id === commentId)

  if (index !== -1) {
    comments[index] = {
      ...comments[index],
      ...updates,
      updatedAt: new Date(),
    }
    safeLocalStorage.setItem('comments', JSON.stringify(comments))
    logger.info('Commentaire mis à jour', { commentId })
  }
}

/**
 * Supprime un commentaire
 */
export function deleteComment(commentId: string): void {
  const comments = getComments()
  const filtered = comments.filter(c => c.id !== commentId)
  safeLocalStorage.setItem('comments', JSON.stringify(filtered))
  logger.info('Commentaire supprimé', { commentId })
}

/**
 * Ajoute une réaction à un commentaire
 */
export function addReaction(commentId: string, emoji: string, userId: string): void {
  const commentsJson = safeLocalStorage.getItem('comments')
  if (!commentsJson) return

  const comments = JSON.parse(commentsJson)
  const comment = comments.find((c: Comment) => c.id === commentId)

  if (comment) {
    if (!comment.reactions) comment.reactions = {}
    if (!comment.reactions[emoji]) comment.reactions[emoji] = []
    
    if (!comment.reactions[emoji].includes(userId)) {
      comment.reactions[emoji].push(userId)
      safeLocalStorage.setItem('comments', JSON.stringify(comments))
      logger.debug('Réaction ajoutée', { emoji, commentId, userId })
    }
  }
}

/**
 * Récupère les notifications
 */
export function getNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
  const notifsJson = safeLocalStorage.getItem('notifications')
  let notifs: Notification[] = notifsJson ? JSON.parse(notifsJson) : []

  // Convertir les dates
  notifs = notifs.map(n => ({
    ...n,
    createdAt: new Date(n.createdAt),
  }))

  // Filtrer par utilisateur
  notifs = notifs.filter(n => n.userId === userId)

  // Filtrer par statut lu/non lu
  if (unreadOnly) {
    notifs = notifs.filter(n => !n.read)
  }

  return notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Crée une notification
 */
export function createNotification(
  notif: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Notification {
  const notifs = getNotifications(notif.userId)

  const newNotif: Notification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    read: false,
  }

  const allNotifs = [...notifs, newNotif]
  safeLocalStorage.setItem('notifications', JSON.stringify(allNotifs))

  logger.info('Notification créée', { notificationId: newNotif.id, userId: newNotif.userId, type: newNotif.type })

  return newNotif
}

/**
 * Marque une notification comme lue
 */
export function markNotificationAsRead(notificationId: string): void {
  const notifsJson = safeLocalStorage.getItem('notifications')
  if (!notifsJson) return

  const notifs = JSON.parse(notifsJson)
  const notif = notifs.find((n: Notification) => n.id === notificationId)

  if (notif) {
    notif.read = true
    safeLocalStorage.setItem('notifications', JSON.stringify(notifs))
    logger.debug('Notification marquée comme lue', { notificationId })
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export function markAllNotificationsAsRead(userId: string): void {
  const notifsJson = safeLocalStorage.getItem('notifications')
  if (!notifsJson) return

  const notifs = JSON.parse(notifsJson)
  notifs.forEach((n: Notification) => {
    if (n.userId === userId && !n.read) {
      n.read = true
    }
  })

  safeLocalStorage.setItem('notifications', JSON.stringify(notifs))
  logger.info('Toutes les notifications marquées comme lues', { count: notifs.filter((n: any) => !n.read).length })
}

/**
 * Récupère le fil d'activité
 */
export function getActivities(filters?: {
  targetId?: string
  userId?: string
  limit?: number
}): Activity[] {
  const activitiesJson = safeLocalStorage.getItem('activities')
  let activities: Activity[] = activitiesJson ? JSON.parse(activitiesJson) : []

  // Convertir les dates
  activities = activities.map(a => ({
    ...a,
    timestamp: new Date(a.timestamp),
  }))

  // Appliquer les filtres
  if (filters) {
    if (filters.targetId) {
      activities = activities.filter(a => a.targetId === filters.targetId)
    }
    if (filters.userId) {
      activities = activities.filter(a => a.userId === filters.userId)
    }
    if (filters.limit) {
      activities = activities.slice(0, filters.limit)
    }
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Enregistre une activité
 */
export function logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Activity {
  const activities = getActivities()

  const newActivity: Activity = {
    ...activity,
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  }

  activities.push(newActivity)
  
  // Garder seulement les 1000 dernières
  const limited = activities.slice(0, 1000)
  safeLocalStorage.setItem('activities', JSON.stringify(limited))

  logger.debug('Activité enregistrée', { activityId: newActivity.id, type: newActivity.type, targetId: newActivity.targetId })

  return newActivity
}

/**
 * Parse les mentions dans un texte
 */
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const matches = text.matchAll(mentionRegex)
  return Array.from(matches).map(match => match[1])
}

/**
 * Formate un texte avec mentions en HTML
 */
export function formatTextWithMentions(text: string): string {
  return text.replace(
    /@(\w+)/g,
    '<span class="text-blue-600 font-medium cursor-pointer hover:underline">@$1</span>'
  )
}

/**
 * Récupère le nombre de notifications non lues
 */
export function getUnreadNotificationsCount(userId: string): number {
  return getNotifications(userId, true).length
}

/**
 * Statistiques de collaboration
 */
export function getCollaborationStats(targetId: string): {
  commentsCount: number
  contributorsCount: number
  lastActivity?: Date
} {
  const comments = getComments({ dossierId: targetId })
  const activities = getActivities({ targetId, limit: 1 })

  const contributors = new Set(comments.map(c => c.userId))

  return {
    commentsCount: comments.length,
    contributorsCount: contributors.size,
    lastActivity: activities.length > 0 ? activities[0].timestamp : undefined,
  }
}
