'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';

interface UploadedDocument {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  ocrText?: string;
  extractedData?: Record<string, unknown>;
  error?: string;
}

export default function DocumentUploadPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const tenantId = 'demo-tenant-001';
  const uploadedBy = 'demo-user-001';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Ajouter le document en etat "uploading"
    setDocuments((prev) => [
      ...prev,
      { id: tempId, filename: file.name, status: 'uploading' },
    ]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenantId);
      formData.append('uploadedBy', uploadedBy);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Mettre a jour avec l'ID reel
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...d, id: data.document.id, status: 'processing' }
              : d
          )
        );

        // Verifier le statut OCR periodiquement
        pollOCRStatus(data.document.id);
      } else {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...d, status: 'error', error: data.error || 'Erreur upload' }
              : d
          )
        );
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempId
            ? { ...d, status: 'error', error: 'Erreur reseau' }
            : d
        )
      );
    }
  };

  const pollOCRStatus = useCallback(async (documentId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes max

    const check = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/documents?id=${documentId}`);
        const data = await res.json();

        if (data.document?.ocrProcessed) {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === documentId
                ? {
                    ...d,
                    status: 'completed',
                    ocrText: data.document.ocrText,
                    extractedData: data.document.extractedData
                      ? JSON.parse(data.document.extractedData)
                      : undefined,
                  }
                : d
            )
          );
        } else if (attempts < maxAttempts) {
          setTimeout(check, 1000);
        } else {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === documentId
                ? { ...d, status: 'completed', ocrText: 'Traitement en cours...' }
                : d
            )
          );
        }
      } catch (error) {
        console.error('Erreur verification OCR:', error);
      }
    };

    setTimeout(check, 2000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      uploading: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      uploading: ' Upload...',
      processing: ' Analyse OCR...',
      completed: ' Termine',
      error: ' Erreur',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900"> Documents & OCR</h1>
        <p className="text-gray-600">
          Importez vos documents pour extraction automatique du texte et des donnees
        </p>
      </div>

      {/* Zone de drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="text-6xl mb-4"></div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          Glissez-deposez vos fichiers ici
        </p>
        <p className="text-sm text-gray-500 mb-4">
          ou cliquez pour selectionner
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.doc,.docx"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Selectionner des fichiers
        </label>
        <p className="text-xs text-gray-400 mt-4">
          Formats supportes: PDF, Images (PNG, JPG), Documents (DOC, DOCX)
        </p>
      </div>

      {/* Liste des documents */}
      {documents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Documents importes</h2>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {doc.filename.endsWith('.pdf') ? '' : '️'}
                    </span>
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>
                  {doc.status === 'processing' && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  )}
                </div>

                {doc.status === 'error' && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                    {doc.error}
                  </div>
                )}

                {doc.status === 'completed' && doc.ocrText && (
                  <div className="space-y-3">
                    {/* Texte extrait */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                         Texte extrait:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto text-sm font-mono">
                        {doc.ocrText.substring(0, 1000)}
                        {doc.ocrText.length > 1000 && '...'}
                      </div>
                    </div>

                    {/* Donnees extraites */}
                    {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                           Donnees analysees:
                        </p>
                        <div className="bg-blue-50 rounded-lg p-3">
                          {Object.entries(doc.extractedData).map(([key, value]) => (
                            <div key={key} className="flex gap-2 text-sm mb-1">
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="text-gray-800">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-3"> Comment ca marche ?</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2"></div>
            <p className="font-medium">1. Upload</p>
            <p className="text-sm text-gray-500">
              Importez vos documents (factures, contrats, pieces d&apos;identite...)
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2"></div>
            <p className="font-medium">2. Analyse OCR</p>
            <p className="text-sm text-gray-500">
              Le texte est automatiquement extrait par reconnaissance optique
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2"></div>
            <p className="font-medium">3. IA</p>
            <p className="text-sm text-gray-500">
              L&apos;IA identifie les informations cles (dates, montants, noms...)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
