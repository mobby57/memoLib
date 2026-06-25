'use client';

import { useState } from 'react';
import { Scale, AlertTriangle, Shield, Loader2, FileText, Target } from 'lucide-react';

interface SecondAvisResult {
  weaknesses: { point: string; severity: 'critical' | 'high' | 'medium'; explanation: string }[];
  missingPieces: string[];
  adverseArguments: string[];
  rejectionRisks: { risk: string; probability: string }[];
  reinforcements: string[];
  overallAssessment: string;
}

export function SecondAvis({ dossierId }: { dossierId: string }) {
  const [result, setResult] = useState<SecondAvisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSecondAvis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ai/second-avis/${dossierId}`);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch { setError("Impossible d'obtenir un second avis"); }
    finally { setLoading(false); }
  };

  if (!result) {
    return (
      <div className="border-2 border-dashed border-orange-200 rounded-2xl p-6 text-center bg-orange-50/50">
        <Scale className="w-10 h-10 text-orange-600 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 mb-1">Demander un Second Avis</h3>
        <p className="text-sm text-gray-600 mb-4">
          L&apos;IA joue le rôle du contradicteur : faiblesses, risques de rejet, arguments adverses.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button
          onClick={runSecondAvis}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyse en cours...</> : <><Shield className="w-5 h-5" />SECOND AVIS</>}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <p className="text-sm text-orange-800 font-medium">{result.overallAssessment}</p>
      </div>

      {/* Faiblesses */}
      {result.weaknesses.length > 0 && (
        <Section title="Faiblesses identifiées" icon={AlertTriangle}>
          {result.weaknesses.map((w, i) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <SeverityDot severity={w.severity} />
                <span className="text-sm font-medium">{w.point}</span>
              </div>
              <p className="text-xs text-gray-600 ml-5 mt-1">{w.explanation}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Pièces manquantes */}
      {result.missingPieces.length > 0 && (
        <Section title="Pièces manquantes" icon={FileText}>
          <ul className="space-y-1">
            {result.missingPieces.map((p, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />{p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Arguments adverses */}
      {result.adverseArguments.length > 0 && (
        <Section title="Arguments adverses probables" icon={Target}>
          {result.adverseArguments.map((a, i) => (
            <p key={i} className="text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0">• {a}</p>
          ))}
        </Section>
      )}

      {/* Risques de rejet */}
      {result.rejectionRisks.length > 0 && (
        <Section title="Risques de rejet" icon={Shield}>
          {result.rejectionRisks.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{r.risk}</span>
              <span className="text-xs font-medium text-red-600">{r.probability}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Pistes de renforcement */}
      {result.reinforcements.length > 0 && (
        <Section title="Pistes de renforcement" icon={Target}>
          {result.reinforcements.map((r, i) => (
            <p key={i} className="text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0">✓ {r}</p>
          ))}
        </Section>
      )}

      <button onClick={runSecondAvis} className="w-full py-2 text-sm text-orange-600 hover:text-orange-800 font-medium">
        ↻ Relancer le second avis
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-600" />
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500' };
  return <span className={`w-2 h-2 rounded-full ${colors[severity as keyof typeof colors] || 'bg-gray-400'}`} />;
}
