'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Mail, FolderPlus, UserPlus, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: React.ReactNode;
  cta: string;
}

interface OnboardingSteps {
  accountCreated: boolean;
  firstClient: boolean;
  firstEmail: boolean;
  firstDossier: boolean;
}

interface Props {
  steps: OnboardingSteps;
  userName?: string;
  onDismiss: () => void;
}

export function OnboardingWizard({ steps, userName, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const allSteps: OnboardingStep[] = [
    {
      id: 'account',
      title: 'Compte créé',
      description: 'Votre espace est prêt',
      completed: steps.accountCreated,
      href: '#',
      icon: <CheckCircle className="w-5 h-5" />,
      cta: 'Fait',
    },
    {
      id: 'client',
      title: 'Ajouter un client',
      description: 'Créez votre première fiche client en 30 secondes',
      completed: steps.firstClient,
      href: '/clients?action=new',
      icon: <UserPlus className="w-5 h-5" />,
      cta: 'Ajouter un client',
    },
    {
      id: 'email',
      title: 'Traiter un email',
      description: 'Importez ou transférez un email pour le lier à un dossier',
      completed: steps.firstEmail,
      href: '/emails',
      icon: <Mail className="w-5 h-5" />,
      cta: 'Voir les emails',
    },
    {
      id: 'dossier',
      title: 'Créer un dossier',
      description: 'Ouvrez votre premier dossier juridique',
      completed: steps.firstDossier,
      href: '/dossiers/nouveau',
      icon: <FolderPlus className="w-5 h-5" />,
      cta: 'Créer un dossier',
    },
  ];

  const completedCount = allSteps.filter((s) => s.completed).length;
  const progress = (completedCount / allSteps.length) * 100;
  const nextStep = allSteps.find((s) => !s.completed);

  if (completedCount === allSteps.length) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Tout est prêt !</h3>
              <p className="text-sm text-green-700">Votre cabinet est opérationnel. Bonne utilisation de MemoLib.</p>
            </div>
          </div>
          <button onClick={() => { setDismissed(true); onDismiss(); }} className="text-sm text-green-600 hover:text-green-800 font-medium">
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {userName ? `Bienvenue, ${userName} 👋` : 'Bienvenue sur MemoLib 👋'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configurez votre espace en quelques étapes
          </p>
        </div>
        <button onClick={() => { setDismissed(true); onDismiss(); }} className="text-xs text-gray-400 hover:text-gray-600">
          Passer
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {allSteps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
              step.completed
                ? 'bg-gray-50 opacity-60'
                : step === nextStep
                  ? 'bg-blue-50 border border-blue-100'
                  : 'bg-gray-50'
            }`}
          >
            <div className={`flex-shrink-0 ${step.completed ? 'text-green-500' : step === nextStep ? 'text-blue-500' : 'text-gray-300'}`}>
              {step.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {!step.completed && (
              <Link
                href={step.href}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                {step.cta}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
