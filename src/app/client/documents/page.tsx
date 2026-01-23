'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  description?: string;
  dossier?: {
    numero: string;
    typeDossier: string;
  };
}

export default function DocumentsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'CLIENT') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'CLIENT') {
      fetchDocuments();
    }
  }, [session, status, router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/client/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', 'Document téléversé par le client');

    try {
      const res = await fetch('/api/client/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchDocuments();
        alert('Document téléversé avec succès !');
      } else {
        alert('Erreur lors du téléversement');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📄';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    
    return matchesSearch && doc.mimeType.includes(filter);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/client"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">←</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Mes Documents
                </h1>
                <p className="text-gray-600 mt-1">Gérez tous vos documents juridiques</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Upload Zone */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter un document</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <span className="text-6xl">{uploading ? '⏳' : '📤'}</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {uploading ? 'Téléversement en cours...' : 'Cliquez pour ajouter un fichier'}
                </span>
                <span className="text-sm text-gray-500">
                  PDF, JPEG, PNG, DOCX (max 10 MB)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({documents.length})
              </button>
              <button
                onClick={() => setFilter('pdf')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'pdf'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📕 PDF
              </button>
              <button
                onClick={() => setFilter('image')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'image'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🖼️ Images
              </button>
              <button
                onClick={() => setFilter('word')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'word'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📘 Word
              </button>
            </div>
          </div>
        </div>

        {/* Liste des documents */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {filteredDocuments.length} document(s)
          </h2>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📁</span>
              <p className="text-gray-500 text-lg">
                {searchTerm || filter !== 'all'
                  ? 'Aucun document ne correspond à votre recherche'
                  : 'Aucun document pour le moment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <span className="text-3xl">{getFileIcon(doc.mimeType)}</span>
                    </div>
                    <a
                      href={`/api/client/documents/${doc.id}/download`}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      download
                      title="Télécharger"
                    >
                      ⬇️
                    </a>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {doc.originalName}
                  </h3>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  {doc.dossier && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <Link
                        href={`/client/dossiers/${doc.dossier}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        📁 {doc.dossier.typeDossier}
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatBytes(doc.sizeBytes)}</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conseils */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-blue-900 mb-2">Conseils pour vos documents</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Privilégiez le format PDF pour les documents officiels</li>
                <li>• Nommez vos fichiers de manière claire et descriptive</li>
                <li>• Assurez-vous que les documents sont lisibles et complets</li>
                <li>• Les documents seront accessibles à votre avocat</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
