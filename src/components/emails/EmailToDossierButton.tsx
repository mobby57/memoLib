'use client';

import { useState } from 'react';
import { CheckCircle, FolderPlus, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface EmailSummary {
  client: string | null;
  objet: string;
  urgence: 'basse' | 'moyenne' | 'haute' | 'critique';
  actionRequise: string;
  deadlineDetectee: string | null;
  typeDossier: string;
  resumeCourt: string;
}

interface Props {
  emailId: string;
  summary: EmailSummary;
}

export function EmailToDossierButton({ emailId, summary }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [result, setResult] = useState<{ dossierId: string; numero: string; clientName?: string } | null>(null);
  const [error, setError] = useState('');

  const createDossier = async () => {
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/emails/create-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, summary }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        setState('done');
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Erreur création dossier');
        setState('idle');
      }
    } catch {
      setError('Erreur création dossier');
      setState('idle');
    }
  };

  if (state === 'done' && result) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-700" />
        <span className="text-xs font-medium text-green-700">
          Dossier {result.numero} créé
        </span>
        <Link href={`/dossiers/${result.dossierId}`} className="text-green-700 hover:text-green-800">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={createDossier}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FolderPlus className="w-3.5 h-3.5" />
        )}
        Créer dossier
      </button>
      {error && <p role="alert" className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
