'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Scale, FileCheck, Download, Eye, Shield, CheckCircle } from 'lucide-react';

const DEMO_STEPS = [
  { id: 1, label: 'Email entrant', href: '/demo/email-simulator' },
  { id: 2, label: 'Raisonnement dossier', href: '/demo/workspace-reasoning' },
  { id: 3, label: 'Preuve légale', href: '/demo/legal-proof' },
];

const LEGAL_DOCUMENTS = [
  {
    id: 1,
    name: 'Recours OQTF - Modèle Type',
    type: 'Recours administratif',
    status: 'generated',
    pages: 8,
    deadline: '15 jours',
  },
  {
    id: 2,
    name: 'Pièces justificatives requises',
    type: 'Liste de contrôle',
    status: 'generated',
    pages: 2,
    deadline: 'Immédiat',
  },
  {
    id: 3,
    name: 'Jurisprudence pertinente',
    type: 'Références légales',
    status: 'generated',
    pages: 5,
    deadline: 'Consultation',
  },
];

const COMPLIANCE_CHECKS = [
  { id: 1, name: 'Délais légaux respectés', status: 'valid', details: 'Recours dans les 30 jours' },
  { id: 2, name: 'Pièces obligatoires', status: 'warning', details: '2 documents manquants' },
  { id: 3, name: 'Forme juridique', status: 'valid', details: 'Conforme au Code de l\'entrée' },
  { id: 4, name: 'Signature électronique', status: 'valid', details: 'Certificat valide' },
];

export default function LegalProofPage() {
  const { locale } = useParams<{ locale: string }>();
  const withLocale = (path: string) => `/${locale}${path}`;

  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parcours de démonstration</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DEMO_STEPS.map((step) => {
              const isActive = step.id === 3;
              return (
                <Link
                  key={step.id}
                  href={withLocale(step.href)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {step.id}
                  </span>
                  {step.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Scale className="w-8 h-8 text-green-600" />
            Génération de Preuves Légales
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Documents juridiques générés automatiquement avec vérification de conformité
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Documents Générés
            </h2>

            <div className="space-y-4">
              {LEGAL_DOCUMENTS.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDoc === doc.id 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDoc(doc.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{doc.type}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{doc.pages} pages</span>
                        <span>Délai: {doc.deadline}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPreview(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedDoc && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Aperçu du document</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>Objet:</strong> Recours contre l'OQTF notifiée le 15/01/2026</p>
                  <p><strong>Fondement juridique:</strong> Article L. 512-1 du CESEDA</p>
                  <p><strong>Moyens invoqués:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Vie privée et familiale (art. 8 CEDH)</li>
                    <li>Intérêt supérieur des enfants</li>
                    <li>Ancienneté de présence sur le territoire</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Vérifications Légales
            </h2>

            <div className="space-y-4">
              {COMPLIANCE_CHECKS.map((check) => (
                <div key={check.id} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    check.status === 'valid' ? 'bg-green-100 text-green-600' :
                    check.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {check.status === 'valid' && <CheckCircle className="w-4 h-4" />}
                    {check.status === 'warning' && <span className="text-xs">!</span>}
                    {check.status === 'error' && <span className="text-xs">✕</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{check.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{check.details}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">✅ Dossier Prêt</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Le dossier respecte les exigences légales et peut être déposé.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Déposer le recours
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Envoyer au client
              </button>
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

        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu du document</h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg font-mono text-sm">
                  <h4 className="font-bold mb-4">RECOURS CONTRE OBLIGATION DE QUITTER LE TERRITOIRE FRANÇAIS</h4>
                  <p className="mb-4">Monsieur le Préfet,</p>
                  <p className="mb-4">
                    Par la présente, je forme un recours gracieux contre l'obligation de quitter 
                    le territoire français qui m'a été notifiée le 15 janvier 2026...
                  </p>
                  <p className="mb-4">
                    <strong>MOYENS DE DROIT :</strong>
                  </p>
                  <p className="mb-2">
                    1. Violation de l'article 8 de la Convention européenne des droits de l'homme
                  </p>
                  <p className="mb-2">
                    2. Méconnaissance de l'intérêt supérieur des enfants
                  </p>
                  <p className="mb-4">
                    3. Ancienneté de présence sur le territoire français (5 ans)
                  </p>
                  <p className="text-gray-500">... [Document complet de 8 pages]</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}