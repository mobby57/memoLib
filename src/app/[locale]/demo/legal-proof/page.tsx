'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scale, FileCheck, Download, Eye, Shield } from 'lucide-react';
import { DemoProgressBar } from '@/components/demo/DemoProgressBar';
import { DemoStepCTA } from '@/components/demo/DemoStepCTA';

const LEGAL_DOCUMENTS = [
  {
    id: 'checklist',
    name: 'Checklist de démonstration',
    type: 'Exemple générique',
    content:
      'DÉMONSTRATION — DOCUMENT FICTIF, SANS VALEUR JURIDIQUE\n\n1. Vérifier la pièce originale.\n2. Confirmer les dates et informations avec la personne concernée.\n3. Faire valider toute démarche par un professionnel habilité.',
  },
  {
    id: 'summary',
    name: 'Fiche de synthèse fictive',
    type: 'Exemple générique',
    content:
      'DÉMONSTRATION — DOCUMENT FICTIF, SANS VALEUR JURIDIQUE\n\nObjet : Exemple de demande\nInformations à confirmer : identité, date de réception, documents de référence.\nProchaine étape : revue humaine.',
  },
  {
    id: 'receipt',
    name: 'Trace de réception fictive',
    type: 'Exemple générique',
    content:
      'DÉMONSTRATION — DOCUMENT FICTIF, SANS VALEUR JURIDIQUE\n\nÉvénement : document reçu (simulation)\nDate : non renseignée\nVérification : à effectuer dans le système réel avant toute utilisation.',
  },
];

export default function LegalProofPage() {
  const [selectedDoc, setSelectedDoc] = useState<(typeof LEGAL_DOCUMENTS)[number] | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const downloadExample = (document: (typeof LEGAL_DOCUMENTS)[number]) => {
    const url = URL.createObjectURL(
      new Blob([document.content], { type: 'text/plain;charset=utf-8' })
    );
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.id}-demo.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <DemoProgressBar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Scale className="w-8 h-8 text-green-700" />
            Exemples de documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Supports fictifs à prévisualiser ou télécharger depuis votre navigateur
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Aucun document juridique n’est généré ou validé. Ces exemples ne sont ni des preuves
          certifiées ni des modèles à déposer ou transmettre.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Supports fictifs
            </h2>

            <div className="space-y-4">
              {LEGAL_DOCUMENTS.map(doc => (
                <div
                  key={doc.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedDoc?.id === doc.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{doc.type}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Texte local</span>
                        <span>Aucune donnée réelle</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          setSelectedDoc(doc);
                          setShowPreview(true);
                        }}
                        aria-label={`Prévisualiser ${doc.name}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadExample(doc)}
                        aria-label={`Télécharger ${doc.name}`}
                        className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedDoc && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {selectedDoc.name}
                </h4>
                <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedDoc.content}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Limites de cette maquette
            </h2>

            <div className="space-y-4">
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li>• Aucune vérification de conformité n’est effectuée.</li>
                <li>• Aucun dépôt, envoi ou signature n’est déclenché.</li>
                <li>• Les fichiers téléchargés sont des exemples textuels fictifs.</li>
                <li>• Toute échéance et toute démarche doivent être vérifiées séparément.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/demo/email-simulator"
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Recommencer la démo
          </Link>
        </div>

        {showPreview && selectedDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedDoc.name}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <pre className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>
          </div>
        )}

        <DemoStepCTA />
      </div>
    </div>
  );
}
