'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, FileText, Upload, AlertTriangle, ArrowRight } from 'lucide-react';

interface PortalData {
  dossier: {
    id: string;
    numero: string;
    type: string;
    statut: string;
    prochaine_etape: string;
  } | null;
  documentsManquants: string[];
  demandesCabinet: string[];
  progression: number;
}

/**
 * Vue résumé client V3 :
 * - État du dossier en un coup d'œil
 * - Prochaine étape claire
 * - Documents manquants à déposer
 * - Bouton upload direct
 */
export function ClientPortalSummary({ clientId }: { clientId?: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/client/my-dossiers')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (!res || !res.dossiers?.length) { setData(null); return; }
        const d = res.dossiers[0]; // Dossier principal
        setData({
          dossier: {
            id: d.id,
            numero: d.numero,
            type: d.typeDossier || 'Dossier en cours',
            statut: d.statut,
            prochaine_etape: getNextStep(d.statut),
          },
          documentsManquants: (d.checklistItems || [])
            .filter((i: any) => i.status === 'missing')
            .map((i: any) => i.label)
            .slice(0, 5),
          demandesCabinet: [],
          progression: d.checklistTotal > 0
            ? Math.round(((d.checklistTotal - (d.checklistItems?.filter((i: any) => i.status === 'missing').length || 0)) / d.checklistTotal) * 100)
            : 0,
        });
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse bg-gray-100 rounded-2xl h-48" />;
  if (!data?.dossier) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* État du dossier */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wide">Votre dossier</p>
            <h2 className="text-lg font-bold mt-1">{data.dossier.type}</h2>
            <p className="text-blue-200 text-sm">{data.dossier.numero}</p>
          </div>
          <StatutBadge statut={data.dossier.statut} />
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
            <span>Progression</span>
            <span>{data.progression}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${data.progression}%` }} />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Prochaine étape */}
        <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase">Prochaine étape</p>
            <p className="text-sm text-gray-800 mt-0.5">{data.dossier.prochaine_etape}</p>
          </div>
        </div>

        {/* Documents manquants */}
        {data.documentsManquants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-semibold text-gray-900">Documents à fournir</p>
            </div>
            <ul className="space-y-1 mb-3">
              {data.documentsManquants.map((doc, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                  <FileText className="w-3 h-3 text-orange-400" />{doc}
                </li>
              ))}
            </ul>
            <Link
              href={`/client/dossiers/${data.dossier.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              Déposer mes documents
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {data.documentsManquants.length === 0 && (
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">Tous les documents sont à jour.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; color: string }> = {
    en_cours: { label: 'En cours', color: 'bg-blue-400/20 text-blue-100' },
    en_attente: { label: 'En attente', color: 'bg-yellow-400/20 text-yellow-100' },
    depose: { label: 'Déposé', color: 'bg-green-400/20 text-green-100' },
    cloture: { label: 'Terminé', color: 'bg-gray-400/20 text-gray-200' },
  };
  const c = config[statut] || config.en_cours;
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function getNextStep(statut: string): string {
  const steps: Record<string, string> = {
    en_attente: 'Votre cabinet étudie votre dossier. Vous serez contacté prochainement.',
    en_cours: 'Le cabinet prépare votre recours. Vérifiez si des documents sont manquants.',
    depose: 'Votre recours a été déposé. En attente de la décision du tribunal.',
    audience: 'Audience programmée. Votre avocat vous contactera pour la préparation.',
    cloture: 'Votre dossier est terminé.',
  };
  return steps[statut] || 'Votre dossier est en cours de traitement.';
}
