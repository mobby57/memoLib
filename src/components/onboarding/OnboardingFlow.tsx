'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  Circle,
  FileText,
  FolderPlus,
  HelpCircle,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface OnboardingSteps {
  accountCreated: boolean;
  firstClient: boolean;
  firstEmail: boolean;
  firstDossier: boolean;
}

interface Props {
  steps: OnboardingSteps;
  userName?: string;
  onComplete: () => void;
  onDismiss: () => void;
}

interface OnboardingStep {
  completed: boolean;
  description: string;
  href: string;
  icon: typeof UserPlus;
  id: string;
  title: string;
}

export function OnboardingFlow({ steps, userName, onComplete, onDismiss }: Props) {
  const { locale = 'fr' } = useParams<{ locale?: string }>();
  const prefix = `/${encodeURIComponent(locale)}`;
  const allSteps: OnboardingStep[] = [
    {
      id: 'account',
      title: 'Compte MemoLib',
      description:
        'Votre session est active. Les méthodes de connexion, la vérification et les réglages de sécurité sont gérés dans votre profil Clerk.',
      completed: steps.accountCreated,
      href: `${prefix}/settings/security`,
      icon: ShieldCheck,
    },
    {
      id: 'client',
      title: 'Créer une fiche client structurée',
      description:
        'Saisissez les informations nécessaires dans le formulaire client. N’utilisez que des données pour lesquelles vous êtes autorisé à intervenir.',
      completed: steps.firstClient,
      href: `${prefix}/clients`,
      icon: UserPlus,
    },
    {
      id: 'email',
      title: 'Traiter un email dans la boîte de réception',
      description:
        'Contrôlez toute extraction ou proposition avant de créer ou modifier un dossier. Une suggestion ne déclenche aucune décision juridique.',
      completed: steps.firstEmail,
      href: `${prefix}/emails`,
      icon: Mail,
    },
    {
      id: 'dossier',
      title: 'Créer et vérifier un dossier',
      description:
        'Complétez les champs requis, puis vérifiez les délais, les pièces et les informations avant de confirmer la création.',
      completed: steps.firstDossier,
      href: `${prefix}/dossiers/nouveau`,
      icon: FolderPlus,
    },
  ];
  const completedCount = allSteps.filter(step => step.completed).length;
  const progress = Math.round((completedCount / allSteps.length) * 100);

  if (completedCount === allSteps.length) {
    return (
      <section
        aria-labelledby="onboarding-complete-title"
        className="mb-6 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8"
      >
        <div className="mx-auto max-w-xl text-center">
          <Sparkles aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-green-600" />
          <h2 id="onboarding-complete-title" className="mb-2 text-xl font-bold text-green-900">
            Parcours initial terminé
          </h2>
          <p className="mb-5 text-sm text-green-800">
            Vérifiez les informations et les échéances avant toute action. Les réglages de votre
            compte restent accessibles dans le profil de sécurité Clerk.
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-800 transition-colors hover:bg-green-50"
          >
            Continuer vers le tableau de bord
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="onboarding-title"
      className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="onboarding-title" className="text-lg font-bold">
              {userName ? `${userName}, prenez vos repères` : 'Prenez vos repères'}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Un parcours guidé qui vous mène vers les écrans réellement disponibles.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-xs text-blue-100 underline hover:text-white"
          >
            Faire plus tard
          </button>
        </div>
        <div className="mt-4">
          <div
            aria-label={`Progression du parcours : ${completedCount} étape${completedCount > 1 ? 's' : ''} sur ${allSteps.length}`}
            aria-valuemax={allSteps.length}
            aria-valuemin={0}
            aria-valuenow={completedCount}
            aria-valuetext={`${progress} % terminé`}
            className="h-2 overflow-hidden rounded-full bg-blue-400/30"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-medium text-blue-100">
            {completedCount}/{allSteps.length} étapes
          </p>
        </div>
      </header>

      <ol className="space-y-3 p-6">
        {allSteps.map(step => {
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className={`flex items-start gap-4 rounded-xl border p-4 ${
                step.completed ? 'border-green-100 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {step.completed ? (
                <CheckCircle
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                />
              ) : (
                <Circle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              )}
              <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-sm font-semibold ${step.completed ? 'text-green-900' : 'text-gray-900'}`}
                >
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                <Link
                  href={step.href}
                  className="mt-3 inline-flex text-sm font-medium text-blue-700 underline hover:text-blue-900"
                >
                  {step.completed
                    ? 'Revoir cet écran'
                    : `Ouvrir ${step.title.toLocaleLowerCase('fr-FR')}`}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2">
          <FileText aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          Lisez et validez personnellement toute information issue d’un email ou d’une suggestion.
        </p>
        <Link
          href={`${prefix}/faq`}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-blue-700 underline hover:text-blue-900"
        >
          <HelpCircle aria-hidden="true" className="h-4 w-4" />
          Consulter l’aide
        </Link>
      </footer>
    </section>
  );
}
