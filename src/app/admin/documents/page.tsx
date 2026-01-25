'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Document {
  id: string;
  nom: string;
  type: string;
  taille: number;
  cheminFichier: string;
  dateUpload: string;
  dossier: {
    id: string;
    numero: string;
    titre: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function DocumentsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'ADMIN') {
      fetchDocuments();
    }
  }, [session, status, router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/admin/documents');
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

  const downloadDocument = async (docId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/admin/documents/${docId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.dossier.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.dossier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${doc.client.firstName} ${doc.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.type.includes(filterType);
    
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '[PDF]';
    if (type.includes('image')) return '[IMG]';
    if (type.includes('word') || type.includes('document')) return '[DOC]';
    if (type.includes('excel') || type.includes('spreadsheet')) return '[XLS]';
    return '[FILE]';
  };

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
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-2xl">[Back]</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestion des Documents
              </h1>
              <p className="text-gray-600 mt-1">{documents.length} document(s) au total</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Filtres et Recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="[Search] Rechercher un document (nom, dossier, client)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterType('pdf')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'pdf'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                [emoji] PDF
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'image'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                [emoji]️ Images
              </button>
              <button
                onClick={() => setFilterType('word')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === 'word'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                [emoji] Word
              </button>
            </div>
          </div>
        </div>

        {/* Liste des documents */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">[emoji]</span>
              <p className="text-gray-500 text-lg">
                {searchTerm || filterType !== 'all'
                  ? 'Aucun document ne correspond a votre recherche'
                  : 'Aucun document pour le moment'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Document</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Dossier</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Client</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Type</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Taille</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Date Upload</th>
                    <th className="text-right py-4 px-6 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getFileIcon(doc.type)}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{doc.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Link
                          href={`/admin/dossiers/${doc.dossier.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          <p className="font-mono text-sm text-blue-600">{doc.dossier.numero}</p>
                          <p className="text-sm text-gray-500">{doc.dossier.titre}</p>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                            {doc.client.firstName.charAt(0)}{doc.client.lastName.charAt(0)}
                          </div>
                          <span className="text-gray-700">
                            {doc.client.firstName} {doc.client.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                        {formatFileSize(doc.taille)}
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => downloadDocument(doc.id, doc.nom)}
                          className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition-colors"
                        >
                          Telecharger ️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
