'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, FileText, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { DemoProgressBar } from '@/components/demo/DemoProgressBar';

const REASONING_STEPS = [
  { id: 1, title: 'Lecture du message', description: 'Exemple de repérage de termes' },
  { id: 2, title: 'Priorité à confirmer', description: 'La décision reste au professionnel' },
  {
    id: 3,
    title: 'Vérification des pièces',
    description: 'La source originale doit être consultée',
  },
  {
    id: 4,
    title: 'Proposition de prochaine étape',
    description: 'Aucune action réelle n’est lancée',
  },
  { id: 5, title: 'Validation humaine', description: 'Aucun dossier ni workflow n’est créé' },
];

const EXTRACTED_DATA = {
  keywords: ['message entrant', 'document à examiner', 'date à vérifier'],
  urgency: 'À confirmer par le cabinet',
  deadline: 'Non calculé — vérifier la pièce',
  clientType: 'Fictif (démo)',
  legalArea: 'À déterminer',
  estimatedHours: 'Non estimé',
};

export default function WorkspaceReasoningPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let nextStep = 1;
    const timer = window.setInterval(() => {
      nextStep += 1;
      setCurrentStep(nextStep);

      if (nextStep >= REASONING_STEPS.length) {
        window.clearInterval(timer);
        setIsProcessing(false);
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <DemoProgressBar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            Exemple de parcours de traitement
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Résultat visuel prérempli : aucune analyse IA ni création de dossier n’a lieu
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Maquette locale avec données fictives. Les étapes animées illustrent une interface
          possible ; elles ne correspondent pas à un traitement réel et ne déterminent aucun délai
          juridique.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Parcours illustratif
            </h2>

            <div className="space-y-4">
              {REASONING_STEPS.map(step => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isCurrent
                            ? 'bg-purple-100 text-purple-600 animate-pulse'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          isCompleted
                            ? 'text-green-700 dark:text-green-400'
                            : isCurrent
                              ? 'text-purple-700 dark:text-purple-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Exemple prérempli
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    Priorité à vérifier
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Indication: <strong>{EXTRACTED_DATA.urgency}</strong> — Échéance:{' '}
                  {EXTRACTED_DATA.deadline}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400 text-sm">Domaine</h4>
                  <p className="text-blue-600 dark:text-blue-300">{EXTRACTED_DATA.legalArea}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-700 dark:text-green-400 text-sm">
                    Données
                  </h4>
                  <p className="text-green-700 dark:text-green-300">{EXTRACTED_DATA.clientType}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mots-clés Juridiques
                </h4>
                <div className="flex flex-wrap gap-2">
                  {EXTRACTED_DATA.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Estimation
                </h4>
                <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                  {EXTRACTED_DATA.estimatedHours}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/demo/legal-proof"
            aria-disabled={isProcessing}
            tabIndex={isProcessing ? -1 : undefined}
            onClick={event => {
              if (isProcessing) event.preventDefault();
            }}
            className={`inline-flex items-center gap-2 font-semibold py-3 px-6 rounded-lg transition-colors ${
              isProcessing
                ? 'bg-gray-400 text-white cursor-not-allowed pointer-events-none'
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
                Étape suivante : exemples de documents
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
