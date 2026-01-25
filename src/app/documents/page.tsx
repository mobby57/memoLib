"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import FileUploader from '@/components/FileUploader'
import { getStoredFiles, getFileVersions, deleteFile, downloadFile, formatFileSize, getFileIcon, getStorageStats, type StoredFile } from '@/lib/services/storageService'
import { Download, Trash2, History, Tag, Filter } from 'lucide-react'
import { Button } from '@/components/forms/Button'
import { useToast } from '@/hooks'
import { Modal } from '@/components/forms/Modal'

export default function DocumentsPage() {
  const [files, setFiles] = useState<StoredFile[]>(getStoredFiles())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const { showToast } = useToast()

  const refreshFiles = () => {
    setFiles(getStoredFiles())
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('etes-vous sur de vouloir supprimer ce fichier ?')) return
    
    try {
      await deleteFile(fileId)
      refreshFiles()
      showToast('Fichier supprime avec succes', 'success')
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  const handleDownload = (file: StoredFile) => {
    downloadFile(file)
    showToast('Telechargement demarre', 'info')
  }

  const handleViewVersions = (file: StoredFile) => {
    setSelectedFile(file)
    setShowVersions(true)
  }

  const stats = getStorageStats()
  
  const filteredFiles = selectedCategory === 'all' 
    ? files 
    : files.filter(f => f.metadata.category === selectedCategory)

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
            category: 'piece_jointe',
            description: 'Document uploade via l\'interface',
          }}
          onUploadComplete={() => refreshFiles()}
        />
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
              {getFileVersions(selectedFile.id).map((version) => (
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
