"use client"

import { useState, useRef } from 'react'
import { Upload, X, File, Check, AlertCircle } from 'lucide-react'
import { uploadFile, formatFileSize, getFileIcon, type UploadOptions } from '@/lib/services/storageService'
import { Button } from './forms/Button'
import { useToast } from '@/hooks'

interface FileUploaderProps {
  options: UploadOptions
  onUploadComplete?: (fileId: string) => void
  maxFiles?: number
  accept?: string
}

export default function FileUploader({
  options,
  onUploadComplete,
  maxFiles = 5,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt',
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    if (files.length + selectedFiles.length > maxFiles) {
      showToast(`Maximum ${maxFiles} fichiers autorises`, 'error')
      return
    }

    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    if (files.length + droppedFiles.length > maxFiles) {
      showToast(`Maximum ${maxFiles} fichiers autorises`, 'error')
      return
    }

    setFiles(prev => [...prev, ...droppedFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    const results: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        // Simulation de progression
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0
            if (current >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return { ...prev, [file.name]: current + 10 }
          })
        }, 100)

        const result = await uploadFile(file, options)
        
        clearInterval(progressInterval)
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        
        results.push(result.id)
      }

      showToast(`${files.length} fichier(s) uploade(s) avec succes`, 'success')
      
      if (onUploadComplete && results.length > 0) {
        results.forEach(id => onUploadComplete(id))
      }

      // Reinitialiser
      setFiles([])
      setUploadProgress({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erreur upload:', error)
      showToast('Erreur lors de l\'upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Glissez-deposez vos fichiers ici ou cliquez pour parcourir
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Maximum {maxFiles} fichiers - Types acceptes: {accept}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Liste des fichiers selectionnes */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Fichiers selectionnes ({files.length}/{maxFiles})
          </h3>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
                {uploadProgress[file.name] === 100 ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : uploading && uploadProgress[file.name] !== undefined ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                ) : (
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'upload */}
      {files.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploader {files.length} fichier(s)
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setFiles([])
              setUploadProgress({})
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            variant="outline"
            disabled={uploading}
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  )
}
