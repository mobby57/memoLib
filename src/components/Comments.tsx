"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Smile, AtSign, Paperclip, ThumbsUp, Heart, Trash2 } from 'lucide-react'
import {
  getComments,
  addComment,
  deleteComment,
  addReaction,
  parseMentions,
  type Comment,
} from '@/lib/services/collaborationService'
import { Button } from './forms/Button'
import { useToast } from '@/hooks'

interface CommentsProps {
  dossierId?: string
  clientId?: string
  factureId?: string
  currentUserId: string
  currentUserName: string
}

export default function Comments({
  dossierId,
  clientId,
  factureId,
  currentUserId,
  currentUserName,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadComments()
  }, [dossierId, clientId, factureId])

  const loadComments = () => {
    const loaded = getComments({ dossierId, clientId, factureId })
    setComments(loaded)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) return

    const mentions = parseMentions(newComment)

    addComment({
      dossierId,
      clientId,
      factureId,
      userId: currentUserId,
      userName: currentUserName,
      content: newComment,
      mentions,
      parentId: replyTo || undefined,
    })

    setNewComment('')
    setReplyTo(null)
    loadComments()
    showToast('Commentaire ajouté', 'success')
  }

  const handleDelete = (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    deleteComment(commentId)
    loadComments()
    showToast('Commentaire supprimé', 'success')
  }

  const handleReaction = (commentId: string, emoji: string) => {
    addReaction(commentId, emoji, currentUserId)
    loadComments()
  }

  const handleReply = (comment: Comment) => {
    setReplyTo(comment.id)
    setNewComment(`@${comment.userName} `)
    textareaRef.current?.focus()
  }

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const hasReacted = (emoji: string) => {
      return comment.reactions?.[emoji]?.includes(currentUserId) || false
    }

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12 mt-2' : ''} p-4 bg-gray-50 dark:bg-gray-800 rounded-lg`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.userName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {comment.updatedAt > comment.createdAt && (
                <span className="text-xs text-gray-400">(modifié)</span>
              )}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>

            {comment.mentions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {comment.mentions.map(mention => (
                  <span
                    key={mention}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >
                    <AtSign className="w-3 h-3 mr-1" />
                    {mention}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              {/* Réactions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleReaction(comment.id, '👍')}
                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                    hasReacted('👍')
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  👍 {comment.reactions?.['👍']?.length || ''}
                </button>
                <button
                  onClick={() => handleReaction(comment.id, '❤️')}
                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                    hasReacted('❤️')
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  ❤️ {comment.reactions?.['❤️']?.length || ''}
                </button>
              </div>

              <button
                onClick={() => handleReply(comment)}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Répondre
              </button>

              {comment.userId === currentUserId && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Réponses */}
        {comments
          .filter(c => c.parentId === comment.id)
          .map(reply => renderComment(reply, true))}
      </div>
    )
  }

  const mainComments = comments.filter(c => !c.parentId)

  return (
    <div className="space-y-4">
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Répondre à {comments.find(c => c.id === replyTo)?.userName}</span>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null)
                setNewComment('')
              }}
              className="text-blue-600 hover:underline"
            >
              Annuler
            </button>
          </div>
        )}
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Écrivez un commentaire... (utilisez @ pour mentionner)"
            className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Pièce jointe"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Utilisez <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">@nom</span> pour mentionner quelqu'un
        </p>
      </form>

      {/* Liste des commentaires */}
      <div className="space-y-3">
        {mainComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucun commentaire. Soyez le premier à commenter !
          </div>
        ) : (
          mainComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}
