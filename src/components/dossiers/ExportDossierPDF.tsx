'use client';

import { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  dossierId: string;
  dossierNumero: string;
}

/**
 * Bouton d'export dossier complet en PDF.
 * Utilisé dans la page détail dossier ou la timeline.
 */
export function ExportDossierPDF({ dossierId, dossierNumero }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/dossiers/export?dossierId=${dossierId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur export');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dossier_${dossierNumero}_export.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 shadow-sm"
      title="Exporter le dossier complet en PDF (pour audience)"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : success ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{success ? 'Exporté !' : 'Export PDF'}</span>
      <FileText className="w-3.5 h-3.5 opacity-60" />
    </button>
  );
}
