'use client';

import { useState } from 'react';
import { AlertTriangle, Upload, Loader2, Clock, FileText, Shield, Zap } from 'lucide-react';

interface UrgencyResult {
  delaiEstime: string;
  joursRestants: number | null;
  niveauRisque: 'critique' | 'élevé' | 'moyen' | 'faible';
  actionsPrioritaires: string[];
  documentsManquants: string[];
  procedureRecommandee: string;
  typeProcedure: string;
}

export function ModeUrgence() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrgencyResult | null>(null);

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (file) formData.append('file', file);

      const res = await fetch('/api/ai/urgence', { method: 'POST', body: formData });
      if (res.ok) setResult(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  // Bouton flottant
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-red-600 text-white font-bold rounded-full shadow-2xl hover:bg-red-700 transition-all flex items-center gap-2 animate-pulse hover:animate-none"
      >
        <AlertTriangle className="w-5 h-5" />
        URGENCE
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="font-bold text-lg">MODE URGENCE</h2>
            </div>
            <button onClick={() => { setOpen(false); setResult(null); }} className="text-white/70 hover:text-white text-xl">✕</button>
          </div>
          <p className="text-red-100 text-sm mt-1">Collez un email, une décision ou uploadez un PDF. Analyse en &lt;30s.</p>
        </div>

        {!result ? (
          <div className="p-5 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Collez ici l'email, la décision ou le courrier..."
              className="w-full h-32 border-2 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />

            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{file ? file.name : 'Ou déposez un fichier (PDF, image)'}</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>

            <button
              onClick={analyze}
              disabled={loading || (!text && !file)}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyse en cours...</> : <><Zap className="w-5 h-5" />ANALYSER IMMÉDIATEMENT</>}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Résultat */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Clock} label="Délai estimé" value={result.delaiEstime} />
              <InfoCard icon={Shield} label="Risque" value={result.niveauRisque} color={riskColor(result.niveauRisque)} />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Procédure détectée</p>
              <p className="text-sm font-medium">{result.typeProcedure}</p>
              <p className="text-xs text-gray-600 mt-1">{result.procedureRecommandee}</p>
            </div>

            {result.actionsPrioritaires.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions prioritaires</p>
                <ol className="space-y-1">
                  {result.actionsPrioritaires.map((a, i) => (
                    <li key={i} className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.documentsManquants.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Documents manquants</p>
                <ul className="space-y-1">
                  {result.documentsManquants.map((d, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <FileText className="w-3 h-3 text-red-400" />{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => setResult(null)} className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium">
              ↻ Nouvelle analyse
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <Icon className="w-4 h-4 text-gray-400 mb-1" />
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-bold ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function riskColor(level: string) {
  const map: Record<string, string> = { critique: 'text-red-600', 'élevé': 'text-orange-600', moyen: 'text-yellow-600', faible: 'text-green-600' };
  return map[level] || 'text-gray-900';
}
