'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Plus, Download, Trash2 } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/documents');
      const data = await response.json();
      setDocuments(data.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-1">Gérez vos documents</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Télécharger
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
          <p className="text-slate-600">Aucun document</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="truncate">
                <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                <p className="text-sm text-slate-600">{doc.category}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Download size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
