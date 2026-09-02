"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import FileUploader from '@/components/FileUploader'
import { DocxDocumentGenerator } from '@/components/documents/DocxDocumentGenerator'
import { formatFileSize, getFileIcon, type StoredFile } from '@/lib/services/storageService'
import { Download, Trash2, History, Tag, Filter } from 'lucide-react'
import { Button } from '@/components/forms/Button'
import { useToast } from '@/hooks'
import { Modal } from '@/components/forms/Modal'

export default function DocumentsPage() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null)
  const [selectedFileVersions, setSelectedFileVersions] = useState<StoredFile[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const getDossierId = (): string | null => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('dossierId')
  }

  const loadFiles = async () => {
    const dossierId = getDossierId()

    if (!dossierId) {
      setFiles([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        `/api/documents/upload?dossierId=${encodeURIComponent(dossierId)}&limit=100`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error('Impossible de rÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer les documents')
      }

      const data = await response.json()

      const documents: StoredFile[] = (data.documents || []).map((document: any) => ({
        id: document.id,
        name: document.filename,
        originalName: document.originalName || document.filename,
        size: document.size,
        mimeType: document.mimeType,
        url: `/api/documents/download?id=${encodeURIComponent(document.id)}`,
        uploadedAt: new Date(document.createdAt),
        uploadedBy: '',
        version: 1,
        tags: [],
        metadata: {
          dossierId: document.dossierId,
          category: document.category || 'autre',
          description: document.description || undefined,
        },
      }))

      setFiles(documents)
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error)
      showToast('Impossible de charger les documents', 'error')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFiles()
  }, [])

  const refreshFiles = () => {
    void loadFiles()
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('ÃƒÆ’Ã…Â tes-vous sÃƒÆ’Ã‚Â»r de vouloir supprimer ce fichier ?')) return

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(fileId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      await loadFiles()
      showToast('Fichier supprimÃƒÆ’Ã‚Â© avec succÃƒÆ’Ã‚Â¨s', 'success')
    } catch (error) {
      console.error('Erreur suppression:', error)
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  const handleDownload = async (file: StoredFile) => {
    try {
      const response = await fetch(
        `/api/documents/download/${encodeURIComponent(file.id)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Erreur lors du tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = file.originalName
      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(url)

      showToast('TÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement dÃƒÆ’Ã‚Â©marrÃƒÆ’Ã‚Â©', 'info')
    } catch (error) {
      console.error('Erreur tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement:', error)
      showToast(
        error instanceof Error ? error.message : 'Erreur lors du tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©chargement',
        'error'
      )
    }
  }

  const handleViewVersions = async (file: StoredFile) => {
    setSelectedFile(file)

    try {
      /*
       * Le modÃƒÆ’Ã‚Â¨le Document actuel ne possÃƒÆ’Ã‚Â¨de pas encore de vÃƒÆ’Ã‚Â©ritable
       * endpoint de versioning. On affiche donc au minimum le document
       * courant comme version 1.
       */
      setSelectedFileVersions([file])
    } catch (error) {
      console.error('Erreur chargement versions:', error)
      setSelectedFileVersions([])
    }

    setShowVersions(true)
  }

  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    byCategory: files.reduce((result, file) => {
      const category = file.metadata.category
      result[category] = (result[category] || 0) + 1
      return result
    }, {} as Record<string, number>),
    byType: files.reduce((result, file) => {
      const type = file.mimeType.split('/')[0]
      result[type] = (result[type] || 0) + 1
      return result
    }, {} as Record<string, number>),
  }

  const filteredFiles =
    selectedCategory === 'all'
      ? files
      : files.filter(
          file => file.metadata.category === selectedCategory
        )

  const categories = [
    { value: 'all', label: 'Tous', count: files.length },
    { value: 'piece_jointe', label: 'Pieces jointes', count: stats.byCategory['piece_jointe'] || 0 },
    { value: 'document_genere', label: 'Documents generes', count: stats.byCategory['document_genere'] || 0 },
    { value: 'template', label: 'Templates', count: stats.byCategory['template'] || 0 },
    { value: 'autre', label: 'Autres', count: stats.byCategory['autre'] || 0 },
  ]

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Documents', href: '/documents' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stockage cloud avec versioning
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total fichiers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalFiles}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Espace utilise</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatFileSize(stats.totalSize)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Images</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.byType['image'] || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.byType['application'] || 0}
          </p>
        </Card>
      </div>

      {/* Upload */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Uploader des fichiers
        </h2>
        <FileUploader
          options={{
            dossierId: getDossierId() || undefined,
            description: 'Document uploade via l\'interface',
            category: 'piece_jointe',
          }}
          onUploadComplete={() => refreshFiles()}
        />
      </Card>

      {/* GÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©ration DOCX juridique */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          GÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©rer un document juridique
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          MÃƒÆ’Ã‚Â©moires, conclusions, requÃƒÆ’Ã‚Âªtes ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â format Word (.docx) prÃƒÆ’Ã‚Âªt ÃƒÆ’Ã‚Â imprimer.
        </p>
        <DocxDocumentGenerator />
      </Card>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Liste des fichiers */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Fichiers ({filteredFiles.length})
        </h2>
        
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun fichier trouve
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-3xl">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>-</span>
                      <span>v{file.version}</span>
                      <span>-</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString('fr-FR')}</span>
                      {file.tags.length > 0 && (
                        <>
                          <span>-</span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {file.tags.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                    {file.metadata.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {file.metadata.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewVersions(file)}
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal des versions */}
      {showVersions && selectedFile && (
        <Modal isOpen={showVersions} onClose={() => setShowVersions(false)} title={`Historique des versions - ${selectedFile.originalName}`}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Historique des versions - {selectedFile.originalName}
            </h3>
            
            <div className="space-y-3">
              {selectedFileVersions.map((version) => (
                <div
                  key={version.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Version {version.version}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(version.uploadedAt).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Par {version.uploadedBy}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(version)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}








