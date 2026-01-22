"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckSquare, 
  Mail, 
  Clock,
  Edit2,
  Trash2,
  Archive,
  ExternalLink,
  Share2
} from 'lucide-react'
import UrgencyBadge from '@/components/cesda/UrgencyBadge'
import { PROCEDURE_COLORS, PROCEDURE_LABELS, ProcedureType } from '@/types/cesda'
import type { WorkspaceWithRelations } from '@/types/cesda'
import WorkspaceForm from './WorkspaceForm'
import { io, Socket } from 'socket.io-client'

interface WorkspaceDetailsProps {
  workspaceId: string
  onUpdate?: () => void
  onDelete?: () => void
}

export default function WorkspaceDetails({ 
  workspaceId, 
  onUpdate, 
  onDelete 
}: WorkspaceDetailsProps) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<WorkspaceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline' | 'notes'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  // WebSocket connection
  useEffect(() => {
    const socketInstance = io({ path: '/api/socket' })
    
    socketInstance.on('connect', () => {
      console.log('WebSocket connected')
      socketInstance.emit('join-workspace', workspaceId)
    })

    socketInstance.on('workspace-updated', (data: any) => {
      if (data.workspaceId === workspaceId) {
        console.log('Workspace updated via WebSocket:', data)
        fetchWorkspaceDetails() // Refresh data
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.emit('leave-workspace', workspaceId)
      socketInstance.disconnect()
    }
  }, [workspaceId])

  useEffect(() => {
    fetchWorkspaceDetails()
  }, [workspaceId])

  const fetchWorkspaceDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}`)
      if (!response.ok) throw new Error('Échec du chargement')
      
      const data = await response.json()
      setWorkspace(data)
    } catch (error) {
      console.error('Erreur chargement workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Échec mise à jour')
      
      await fetchWorkspaceDetails()
      onUpdate?.()
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce dossier ?')) return

    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Échec suppression')
      
      onDelete?.()
      router.push('/lawyer/workspaces')
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Dossier non trouvé</h2>
        </div>
      </div>
    )
  }

  const procedureColor = PROCEDURE_COLORS[workspace.procedureType as ProcedureType]
  const procedureLabel = PROCEDURE_LABELS[workspace.procedureType as ProcedureType]

  const getDeadlineStatus = () => {
    if (!workspace.deadlineDate) return null
    
    const now = new Date()
    const deadline = new Date(workspace.deadlineDate)
    const diff = deadline.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (diff <= 0) return { text: 'Expiré', color: 'text-red-600 bg-red-100' }
    if (hours < 48) return { text: `${hours}h restantes`, color: 'text-orange-600 bg-orange-100' }
    if (days < 7) return { text: `${days}j restants`, color: 'text-yellow-600 bg-yellow-100' }
    
    return { text: `${days}j restants`, color: 'text-green-600 bg-green-100' }
  }

  const deadlineStatus = getDeadlineStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex mb-4 text-sm">
            <button 
              onClick={() => router.push('/lawyer/workspaces')}
              className="text-gray-500 hover:text-gray-700"
            >
              Dossiers
            </button>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{workspace.title}</span>
          </nav>

          {/* Title & Actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: procedureColor }}
                />
                <h1 className="text-3xl font-bold text-gray-900">{workspace.title}</h1>
                <UrgencyBadge level={workspace.urgencyLevel as any} />
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${procedureColor}15`,
                    color: procedureColor,
                  }}
                >
                  {procedureLabel}
                </span>
                
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Client:</span>
                  <span className="ml-2">{workspace.client.firstName} {workspace.client.lastName}</span>
                </div>

                {deadlineStatus && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${deadlineStatus.color}`}>
                    <Clock className="w-4 h-4" />
                    {deadlineStatus.text}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
              
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                <Archive className="w-4 h-4" />
                Archiver
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'timeline', label: 'Chronologie', icon: Calendar },
              { id: 'notes', label: 'Notes', icon: Edit2 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {workspace.description || 'Aucune description disponible.'}
                  </p>
                </div>

                {/* Checklist */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Checklist
                    </h2>
                    <span className="text-sm text-gray-600">
                      {workspace.checklist?.filter((item: any) => item.completed).length || 0} / {workspace.checklist?.length || 0}
                    </span>
                  </div>
                  
                  {workspace.checklist && workspace.checklist.length > 0 ? (
                    <div className="space-y-2">
                      {workspace.checklist.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            className="w-5 h-5 text-indigo-600 rounded"
                            readOnly
                          />
                          <span className={item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun élément de checklist.</p>
                  )}
                </div>

                {/* Alerts */}
                {workspace.alerts && workspace.alerts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Alertes actives
                    </h2>
                    <div className="space-y-3">
                      {workspace.alerts.map((alert: any) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.level === 'critical' ? 'bg-red-50 border-red-500' :
                            alert.level === 'warning' ? 'bg-orange-50 border-orange-500' :
                            'bg-yellow-50 border-yellow-500'
                          }`}
                        >
                          <h3 className="font-medium text-gray-900">{alert.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                <p className="text-gray-500">Gestion des documents à implémenter</p>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Chronologie</h2>
                <p className="text-gray-500">Timeline à implémenter</p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-500">Notes à implémenter</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspace._count?.documents || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Alertes</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspace._count?.alerts || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Checklist</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspace._count?.checklist || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Créé le</span>
                  <p className="text-gray-900 mt-1">
                    {new Date(workspace.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-600">Dernière mise à jour</span>
                  <p className="text-gray-900 mt-1">
                    {new Date(workspace.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {workspace.reference && (
                  <div>
                    <span className="text-gray-600">Référence</span>
                    <p className="text-gray-900 mt-1 font-mono">{workspace.reference}</p>
                  </div>
                )}

                <div>
                  <span className="text-gray-600">Statut</span>
                  <select
                    value={workspace.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="closed">Clôturé</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <WorkspaceForm
          workspaceId={workspaceId}
          initialData={workspace}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            fetchWorkspaceDetails()
            // Emit WebSocket event
            socket?.emit('workspace-updated', { workspaceId })
          }}
        />
      )}
    </div>
  )
}
