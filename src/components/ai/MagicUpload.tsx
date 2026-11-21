'use client';
import { useState } from 'react';
import { Sparkles, UploadCloud, Loader2 } from 'lucide-react';

interface MagicUploadProps {
  typeDossier: string;
  onExtract: (data: any) => void;
}

export function MagicUpload({ typeDossier, onExtract }: MagicUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setNotice('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', typeDossier);

    try {
      const res = await fetch('/api/ai/extract', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);
      if (json.mock) {
        setNotice('Mode démo : les données affichées sont fictives.');
      }
      onExtract(json.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'extraction');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-900">Extraction magique par l'IA</h3>
          <p className="text-xs text-indigo-700 mb-3">Déposez l'OQTF pour pré-remplir le dossier automatiquement.</p>
          
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? 'Analyse en cours...' : 'Déposer un document (PDF, JPEG ou PNG)'}
            <input type="file" className="hidden" accept=".pdf,image/jpeg,image/png" onChange={handleFile} disabled={uploading} />
          </label>
          
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {notice && <p role="status" className="text-xs text-amber-700 mt-2">{notice}</p>}
        </div>
      </div>
    </div>
  );
}
