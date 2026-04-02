'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Brain, FileText, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const DEMO_STEPS = [
  { id: 1, label: 'Email entrant', href: '/demo/email-simulator' },
  { id: 2, label: 'Raisonnement dossier', href: '/demo/workspace-reasoning' },
  { id: 3, label: 'Preuve légale', href: '/demo/legal-proof' },
];

const REASONING_STEPS = [
  { id: 1, title: 'Analyse du contenu', description: 'Extraction des mots-clés juridiques', status: 'completed' },
  { id: 2, title: 'Classification urgence', description: 'Évaluation du niveau de priorité', status: 'completed' },
  { id: 3, title: 'Identification client', description: 'Recherche dans la base existante', status: 'completed' },
  { id: 4, title: 'Création dossier', description: 'Génération automatique du workflow', status: 'in-progress' },
  { id: 5, title: 'Attribution avocat', description: 'Sélection selon spécialisation', status: 'pending' },
];

const EXTRACTED_DATA = {
  keywords: ['OQTF', 'recours', 'urgent', 'délai', 'enfants scolarisés'],
  urgency: 'CRITIQUE',
  deadline: '30 jours',
  clientType: 'Existant',
  legalArea: 'Droit des étrangers',
  estimatedHours: '15-20h',
};

export default function WorkspaceReasoningPage() {
  const { locale } = useParams<{ locale: string }>();
  const withLocale = (path: string) => `/${locale}${path}`;

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 5) return prev + 1;
        setIsProcessing(false);
        return prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parcours de démonstration</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DEMO_STEPS.map((step) => {
              const isActive = step.id === 2;
              return (
                <Link
                  key={step.id}
                  href={withLocale(step.href)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
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
            <Brain className="w-8 h-8 text-purple-600" />
            Raisonnement Intelligent du Dossier
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            L'IA analyse l'email et organise automatiquement le workflow juridique
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Processus de Raisonnement
            </h2>

            <div className="space-y-4">
              {REASONING_STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const isPending = currentStep < step.id;

                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100 text-green-600' :
                      isCurrent ? 'bg-purple-100 text-purple-600 animate-pulse' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        isCompleted ? 'text-green-700 dark:text-green-400' :
                        isCurrent ? 'text-purple-700 dark:text-purple-400' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Données Extraites
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-700 dark:text-red-400">Urgence Détectée</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Niveau: <strong>{EXTRACTED_DATA.urgency}</strong> - Délai: {EXTRACTED_DATA.deadline}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400 text-sm">Domaine Juridique</h4>
                  <p className="text-blue-600 dark:text-blue-300">{EXTRACTED_DATA.legalArea}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-700 dark:text-green-400 text-sm">Client</h4>
                  <p className="text-green-600 dark:text-green-300">{EXTRACTED_DATA.clientType}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Mots-clés Juridiques</h4>
                <div className="flex flex-wrap gap-2">
                  {EXTRACTED_DATA.keywords.map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">Estimation Temps</h4>
                <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                  {EXTRACTED_DATA.estimatedHours} de travail juridique
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href={withLocale('/demo/legal-proof')}
            className={`inline-flex items-center gap-2 font-semibold py-3 px-6 rounded-lg transition-colors ${
              isProcessing 
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                Étape suivante: Preuve légale
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}