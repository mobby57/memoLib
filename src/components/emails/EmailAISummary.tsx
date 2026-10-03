'use client';

import { useState } from 'react';
import { Brain, AlertTriangle, Clock, User, FolderPlus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface EmailSummary {
  client: string | null;
  objet: string;
  urgence: 'basse' | 'moyenne' | 'haute' | 'critique';
  actionRequise: string;
  deadlineDetectee: string | null;
  typeDossier: string;
  resumeCourt: string;
  _fallback?: boolean;
}

interface Props {
  emailId: string;
  subject: string;
  body: string;
  from: string;
  onCreateDossier: (summary: EmailSummary) => void;
}

const URGENCE_STYLES = {
  basse: 'bg-gray-100 text-gray-700',
  moyenne: 'bg-yellow-100 text-yellow-800',
  haute: 'bg-orange-100 text-orange-800',
  critique: 'bg-red-100 text-red-800 animate-pulse',
};

const TYPE_LABELS: Record<string, string> = {
  TITRE_SEJOUR: 'Titre de séjour',
  NATURALISATION: 'Naturalisation',
  OQTF: 'OQTF',
  ASILE: 'Asile',
  REGROUPEMENT_FAMILIAL: 'Regroupement familial',
  CONTENTIEUX: 'Contentieux',
  GENERAL: 'Général',
};

export function EmailAISummary({ emailId, subject, body, from, onCreateDossier }: Props) {
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/ai/summarize-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, from }),
      });
      const data = await res.json();
      setSummary(data);
      setExpanded(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  if (error) {
    return (
      <button onClick={analyze} className="text-xs text-red-600 hover:underline">
        Erreur — Réessayer
      </button>
    );
  }

  if (!summary && !loading) {
    return (
      <button
        onClick={analyze}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
      >
        <Brain className="w-3.5 h-3.5" />
        Analyser avec l&apos;IA
      </button>
    );
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Analyse en cours...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="mt-3 border border-indigo-100 rounded-xl bg-gradient-to-r from-indigo-50/50 to-blue-50/50 overflow-hidden">
      {/* Header compact */}
      <div className="px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${URGENCE_STYLES[summary.urgence]}`}>
            {summary.urgence === 'critique' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
            {summary.urgence.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {TYPE_LABELS[summary.typeDossier] || summary.typeDossier}
          </span>
          {summary.client && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" /> {summary.client}
            </span>
          )}
          {summary.deadlineDetectee && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {summary.deadlineDetectee}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onCreateDossier(summary); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Créer dossier
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-indigo-100 pt-3 space-y-2">
          <p className="text-sm text-gray-700">{summary.resumeCourt}</p>
          <p className="text-xs text-gray-500">
            <span className="font-medium">Action :</span> {summary.actionRequise}
          </p>
          {summary._fallback && (
            <p className="text-xs text-amber-500 italic">Analyse par règles (IA indisponible)</p>
          )}
        </div>
      )}
    </div>
  );
}
