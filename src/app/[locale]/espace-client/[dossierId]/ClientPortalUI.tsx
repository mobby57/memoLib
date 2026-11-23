'use client';
import { useState } from 'react';
import { FileText, Upload, ShieldCheck } from 'lucide-react';

type PortalDossier = {
  id: string;
  typeDossier: string;
  objet: string | null;
};

type PortalDocument = {
  id: string;
  filename: string;
  originalName: string;
  antivirusStatus: string | null;
};

export default function ClientPortalUI({
  dossier,
  documents,
}: {
  dossier: PortalDossier;
  documents: PortalDocument[];
}) {
  const [formData, setFormData] = useState({
    nom: '', prenom: '', adresse: '', recit: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('dossierId', dossier.id);

      const res = await fetch('/api/client/documents/upload', { method: 'POST', body: formPayload });
      if (!res.ok) throw new Error('Dépôt du document refusé');
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du dépôt du document');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionError(null);
    try {
      const response = await fetch('/api/client/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossierId: dossier.id, originalLang: 'fr', answers: formData })
      });
      if (!response.ok) throw new Error('Transmission des informations refusée');
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Erreur lors de la transmission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Client Sécurisé</h1>
          <p className="text-slate-500">Dossier : {dossier.typeDossier} - {dossier.objet}</p>
        </div>
        <div className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Accès sécurisé
        </div>
      </div>

      {/* FORMULAIRE D'INTAKE */}
      <form onSubmit={handleSubmitIntake} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Vos informations personnelles</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="client-nom" className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input id="client-nom" required maxLength={120} type="text" className="w-full p-2 border rounded-lg" onChange={e => setFormData({...formData, nom: e.target.value})} />
          </div>
          <div>
            <label htmlFor="client-prenom" className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
            <input id="client-prenom" required maxLength={120} type="text" className="w-full p-2 border rounded-lg" onChange={e => setFormData({...formData, prenom: e.target.value})} />
          </div>
        </div>
        
        <div>
          <label htmlFor="client-adresse" className="block text-sm font-medium text-slate-700 mb-1">Adresse complète</label>
          <input id="client-adresse" required maxLength={500} type="text" className="w-full p-2 border rounded-lg" onChange={e => setFormData({...formData, adresse: e.target.value})} />
        </div>

        <div>
          <label htmlFor="client-recit" className="block text-sm font-medium text-slate-700 mb-1">Récit de votre situation</label>
          <textarea id="client-recit" required maxLength={20000} rows={5} className="w-full p-2 border rounded-lg" placeholder="Expliquez votre situation à votre avocat..." onChange={e => setFormData({...formData, recit: e.target.value})} />
        </div>

        {submissionError && <p role="alert" className="text-sm text-red-600">{submissionError}</p>}
        <button type="submit" disabled={submitted || submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          {submitted ? 'Informations enregistrées, en attente de vérification ✓' : submitting ? 'Transmission...' : 'Transmettre à mon avocat'}
        </button>
      </form>

      {/* UPLOAD DOCUMENTS */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Vos documents</h2>
        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
          <Upload className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-blue-700">{uploading ? 'Envoi sécurisé...' : 'Déposer un document'}</span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        
        <ul className="mt-4 space-y-2">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
              <FileText className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium flex-1">{doc.originalName || doc.filename}</span>
              <span className="text-xs text-slate-500">{doc.antivirusStatus || 'En attente'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
