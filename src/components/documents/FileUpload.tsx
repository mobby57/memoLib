'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, Image, File, Check, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  dossierId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-5 h-5 text-purple-500" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-blue-500" />;
};

export function FileUpload({
  dossierId,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10, // 10 MB par defaut
  acceptedTypes = ['application/pdf', 'image/*', '.doc', '.docx', '.xls', '.xlsx'],
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Ajouter fichier en etat "uploading"
    const uploadingFile: UploadedFile = {
      id: tempId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: '',
      status: 'uploading',
      progress: 0,
    };

    setFiles(prev => [...prev, uploadingFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (dossierId) {
        formData.append('dossierId', dossierId);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur upload');
      }

      const data = await response.json();
      
      const successFile: UploadedFile = {
        id: data.document.id,
        fileName: data.document.fileName,
        fileType: data.document.fileType,
        fileSize: data.document.fileSize,
        url: data.document.url,
        status: 'success',
      };

      setFiles(prev => 
        prev.map(f => f.id === tempId ? successFile : f)
      );

      return successFile;

    } catch (error) {
      const errorFile: UploadedFile = {
        ...uploadingFile,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };

      setFiles(prev => 
        prev.map(f => f.id === tempId ? errorFile : f)
      );

      return errorFile;
    }
  };

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList).slice(0, maxFiles - files.length);
    
    // Validation
    const validFiles = filesToUpload.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`Fichier trop volumineux: ${file.name}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    const uploadedFiles = await Promise.all(
      validFiles.map(file => uploadFile(file))
    );

    setIsUploading(false);

    const successfulFiles = uploadedFiles.filter(f => f.status === 'success');
    if (successfulFiles.length > 0 && onUploadComplete) {
      onUploadComplete(successfulFiles);
    }
  }, [files.length, maxFiles, maxSize, dossierId, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : (
            <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {isDragging ? 'Deposez les fichiers ici' : 'Glissez-deposez vos fichiers'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ou <span className="text-blue-500 hover:text-blue-600">parcourez</span> pour selectionner
            </p>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            PDF, Images, Word, Excel - Max {maxSize} MB par fichier
          </p>
        </div>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fichiers ({files.length})
          </p>
          
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border
                  ${file.status === 'error' 
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }
                `}
              >
                {/* Icone */}
                {getFileIcon(file.fileType)}

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.fileSize)}
                    {file.error && (
                      <span className="text-red-500 ml-2">- {file.error}</span>
                    )}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
