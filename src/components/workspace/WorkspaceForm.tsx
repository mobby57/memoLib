"use client"

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X, Save, Loader2 } from 'lucide-react'
import { ProcedureType, PROCEDURE_LABELS } from '@/types/cesda'

interface WorkspaceFormProps {
  workspaceId?: string
  initialData?: any
  onClose?: () => void
  onSuccess?: () => void
}

export default function WorkspaceForm({ 
  workspaceId, 
  initialData, 
  onClose, 
  onSuccess 
}: WorkspaceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    procedureType: initialData?.procedureType || 'OQTF',
    urgencyLevel: initialData?.urgencyLevel || 'moyen',
    status: initialData?.status || 'active',
    clientId: initialData?.clientId || '',
    deadlineDate: initialData?.deadlineDate 
      ? new Date(initialData.deadlineDate).toISOString().split('T')[0] 
      : '',
    notificationDate: initialData?.notificationDate 
      ? new Date(initialData.notificationDate).toISOString().split('T')[0] 
      : '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = workspaceId 
        ? `/api/lawyer/workspaces/${workspaceId}`
        : '/api/lawyer/workspaces'
      
      const method = workspaceId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadlineDate: formData.deadlineDate ? new Date(formData.deadlineDate).toISOString() : null,
          notificationDate: formData.notificationDate ? new Date(formData.notificationDate).toISOString() : null,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      const result = await response.json()
      
      onSuccess?.()
      
      if (!workspaceId) {
        router.push(`/lawyer/workspaces/${result.id}`)
      } else {
        onClose?.()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {workspaceId ? 'Modifier le dossier' : 'Nouveau dossier CESDA'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du dossier *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: OQTF - M. DUPONT"
            />
          </div>

          {/* Procedure Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de procédure *
            </label>
            <select
              required
              value={formData.procedureType}
              onChange={(e) => handleChange('procedureType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(PROCEDURE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <input
              type="text"
              required
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ID du client"
            />
            <p className="mt-1 text-sm text-gray-500">
              Pour le moment, entrez l'ID du client. Un sélecteur sera ajouté prochainement.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Décrivez la situation du client..."
            />
          </div>

          {/* Grid: Urgency & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'urgence
              </label>
              <select
                value={formData.urgencyLevel}
                onChange={(e) => handleChange('urgencyLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
                <option value="critique">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="closed">Clôturé</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          {/* Grid: Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de notification
              </label>
              <input
                type="date"
                value={formData.notificationDate}
                onChange={(e) => handleChange('notificationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date limite d'action
              </label>
              <input
                type="date"
                value={formData.deadlineDate}
                onChange={(e) => handleChange('deadlineDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {workspaceId ? 'Mettre à jour' : 'Créer le dossier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
