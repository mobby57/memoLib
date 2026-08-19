'use client';

import { useState } from 'react';
import { Sparkles, Download, Loader2, FileText, Wand2 } from 'lucide-react';

interface Props {
  dossierId: string;
  dossierNumero: string;
  clientName: string;
  typeDossier: string;
  objet?: string;
  juridiction?: string;
}

/**
 * Génération intelligente de mémoire de recours pré-rempli par l'IA.
 * L'IA analyse le dossier (emails, documents, timeline) et produit un mémoire structuré.
 */
export function AIGenerateMemoire({ dossierId, dossierNumero, clientName, typeDossier, objet, juridiction }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Étape 1 : Analyser le dossier avec l'IA
      setStep('Analyse du dossier par l\'IA...');
      const analysisRes = await fetch('/api/ai/analyze-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossierId }),
      });

      let analysis: any = null;
      if (analysisRes.ok) {
        analysis = await analysisRes.json();
      }

      // Étape 2 : Générer le DOCX avec les données IA
      setStep('Génération du mémoire DOCX...');
      const res = await fetch('/api/documents/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: 'memoire_recours',
          dossierId,
          variables: {
            requerantNom: clientName,
            requerantAdresse: analysis?.clientAddress || '[Adresse à compléter]',
            defendeurNom: analysis?.adverseParty || '[Partie adverse à compléter]',
            juridiction: juridiction || analysis?.juridiction || 'Tribunal administratif',
            objet: objet || analysis?.objet || `Recours — dossier ${dossierNumero}`,
            dateDecision: analysis?.dateDecision || '[Date décision]',
            dateNotification: analysis?.dateNotification || '[Date notification]',
            delaiLegal: analysis?.delaiLegal || 'deux (2) mois',
            baseLegale: analysis?.baseLegale || '[Base légale à compléter]',
            dateDepot: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            lieu: analysis?.lieu || 'Paris',
            numeroDossier: dossierNumero,
            // Faits extraits par l'IA
            faits: analysis?.faits || [
              { titre: 'Contexte', contenu: '[L\'IA n\'a pas pu extraire les faits. Complétez manuellement.]' },
            ],
            // Moyens juridiques suggérés
            moyens: analysis?.moyens || [
              { titre: 'Erreur d\'appréciation', contenu: '[À compléter]' },
            ],
            // Points contestés
            pointsContestes: analysis?.pointsContestes || [],
            // Pièces
            pieces: analysis?.pieces || [
              { numero: 1, designation: 'Décision attaquée' },
              { numero: 2, designation: 'Preuve de notification' },
            ],
            // Demandes
            demandesPrincipales: analysis?.demandes || [
              'Déclarer le recours recevable ;',
              'Annuler la décision attaquée ;',
              'Enjoindre à l\'administration de réexaminer la situation du requérant.',
            ],
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur génération');
      }

      // Télécharger
      setStep('Téléchargement...');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Memoire_${dossierNumero}_IA.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStep('');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {loading ? step : 'Générer mémoire avec l\'IA'}
        {!loading && <Sparkles className="w-3.5 h-3.5 opacity-70" />}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <p className="text-xs text-gray-400">
        L&apos;IA analyse les emails, documents et timeline du dossier pour pré-remplir le mémoire.
        À relire et compléter par l&apos;avocat.
      </p>
    </div>
  );
}
