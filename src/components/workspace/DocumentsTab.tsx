'use client';

import { Archive, FileText, Image, Video, File, Download, Eye, Check, X, Upload, Plus, Filter, Search } from 'lucide-react';
import { useState } from 'react';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  documentType: string;
  category?: string;
  description?: string;
  source: string;
  sourceId?: string;
  aiProcessed: boolean;
  aiExtractedData?: string;
  aiConfidence?: number;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  tags?: string;
  uploadedAt: string;
  updatedAt: string;
}

interface DocumentsTabProps {
  documents: Document[];
  workspaceId?: string;
  onRefresh: () => void;
}

export default function DocumentsTab({ documents, workspaceId, onRefresh }: DocumentsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || !event.target.files?.[0]) return;
    
    setIsUploading(true);
    try {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'document_general');
      formData.append('category', 'correspondance');
      
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        onRefresh();
        event.target.value = ''; // Reset input
      } else {
        const error = await response.json();
        console.error('Erreur upload:', error);
        alert(error.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerify = async (docId: string) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true }),
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!workspaceId || !confirm('Supprimer ce document ?')) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/documents/${docId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSelectedDoc(null);
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryColors: Record<string, string> = {
    identite: 'bg-blue-100 text-blue-800',
    juridique: 'bg-purple-100 text-purple-800',
    financier: 'bg-green-100 text-green-800',
    correspondance: 'bg-yellow-100 text-yellow-800',
  };

  const filteredDocs = documents.filter(doc => {
    if (filter === 'verified' && !doc.verified) return false;
    if (filter === 'unverified' && doc.verified) return false;
    if (filter === 'ai_processed' && !doc.aiProcessed) return false;
    
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        doc.originalName.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.documentType.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <p className="text-sm text-gray-600 mt-1">{documents.length} document(s) au total</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className={`px-4 py-2 ${isUploading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors flex items-center space-x-2 cursor-pointer`}>
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Upload en cours...' : 'Uploader'}</span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            />
          </label>
          
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, type ou description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {[
            { id: 'all', label: 'Tous' },
            { id: 'verified', label: 'Vérifiés' },
            { id: 'unverified', label: 'Non vérifiés' },
            { id: 'ai_processed', label: 'Traités IA' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-4">
          {filteredDocs.map(doc => {
            const Icon = getFileIcon(doc.mimeType);
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
              >
                {/* Preview ou icône */}
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                  {doc.mimeType.startsWith('image/') ? (
                    <img
                      src={`/api/documents/${doc.id}/thumbnail`}
                      alt={doc.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={doc.mimeType.startsWith('image/') ? 'hidden' : ''}>
                    <Icon className="w-16 h-16 text-gray-400" />
                  </div>
                  
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Nom fichier */}
                <p className="font-medium text-gray-900 text-sm truncate mb-1" title={doc.originalName}>
                  {doc.originalName}
                </p>

                {/* Métadonnées */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{formatFileSize(doc.sizeBytes)}</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center space-x-1 flex-wrap gap-1">
                  {doc.category && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      categoryColors[doc.category] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.category}
                    </span>
                  )}
                  {doc.verified && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      Vérifié
                    </span>
                  )}
                  {doc.aiProcessed && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      IA
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocs.map(doc => {
                const Icon = getFileIcon(doc.mimeType);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{doc.originalName}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.documentType}</td>
                    <td className="px-4 py-3">
                      {doc.category && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          categoryColors[doc.category] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(doc.sizeBytes)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {doc.verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Vérifié
                          </span>
                        )}
                        {doc.aiProcessed && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            IA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download logic
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredDocs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">Aucun document</p>
          <p className="text-sm text-gray-500 mt-2">Uploadez des documents pour commencer</p>
          <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto">
            <Upload className="w-4 h-4" />
            <span>Uploader un document</span>
          </button>
        </div>
      )}

      {/* Modal Preview (simplified) */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedDoc.originalName}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedDoc.documentType}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Taille</p>
                  <p className="font-medium text-gray-900">{formatFileSize(selectedDoc.sizeBytes)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploadé le</p>
                  <p className="font-medium text-gray-900">{new Date(selectedDoc.uploadedAt).toLocaleString('fr-FR')}</p>
                </div>
                {selectedDoc.category && (
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      categoryColors[selectedDoc.category] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDoc.category}
                    </span>
                  </div>
                )}
                {selectedDoc.verified && (
                  <div>
                    <p className="text-sm text-gray-500">Vérification</p>
                    <p className="font-medium text-green-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Vérifié le {new Date(selectedDoc.verifiedAt!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {selectedDoc.aiProcessed && selectedDoc.aiExtractedData && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">IA</span>
                    Données extraites par l'IA
                  </h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDoc.aiExtractedData}</pre>
                  {selectedDoc.aiConfidence && (
                    <p className="text-xs text-purple-600 mt-2">
                      Confiance: {Math.round(selectedDoc.aiConfidence * 100)}%
                    </p>
                  )}
                </div>
              )}

              {selectedDoc.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedDoc.description}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </button>
                {!selectedDoc.verified && (
                  <button className="flex-1 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Vérifier</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
