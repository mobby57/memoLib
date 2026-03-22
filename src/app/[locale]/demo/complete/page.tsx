'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Compass,
  FileText,
  Lightbulb,
  Mail,
  PlayCircle,
  Rocket,
  Shield,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react';

type DemoStep = {
  id: string;
  title: string;
  duration: string;
  why: string;
  action: string;
  href: string;
  tool: string;
  expectedResult: string;
};

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'setup',
    title: 'Configurer votre espace en 2 minutes',
    duration: '2 min',
    why: 'Démarrer avec une base propre pour retrouver facilement clients, dossiers et documents.',
    action:
      'Créez un cabinet, ajoutez 1 collaborateur, puis définissez 3 types de dossier (OQTF, titre de séjour, naturalisation).',
    href: '/auth/login',
    tool: 'Paramètres + utilisateurs + modèles de dossier',
    expectedResult: 'Votre structure est prête et chaque nouveau dossier suit le bon cadre.',
  },
  {
    id: 'emails',
    title: 'Traiter les emails entrants automatiquement',
    duration: '2 min',
    why: 'Réduire le tri manuel et identifier immédiatement les urgences juridiques.',
    action:
      'Lancez le simulateur d\'email et testez 2 cas: un dossier urgent et un dossier standard.',
    href: '/demo/email-simulator',
    tool: 'Ingestion email + classification IA',
    expectedResult: 'Les messages sont catégorisés et priorisés avec les bonnes informations clés.',
  },
  {
    id: 'reasoning',
    title: 'Comprendre le raisonnement du dossier',
    duration: '2 min',
    why: 'Garder la maîtrise juridique avec une IA explicable et vérifiable.',
    action:
      'Ouvrez l\'étape raisonnement et observez la détection d\'urgence, les mots-clés et la proposition de workflow.',
    href: '/demo/workspace-reasoning',
    tool: 'Moteur de raisonnement dossier',
    expectedResult: 'Vous visualisez pourquoi le dossier est priorisé et quelles actions sont proposées.',
  },
  {
    id: 'proof',
    title: 'Générer les preuves et documents légaux',
    duration: '2 min',
    why: 'Accélérer la production documentaire tout en restant conforme.',
    action:
      'Passez sur la preuve légale, ouvrez un document généré et contrôlez les points de conformité.',
    href: '/demo/légal-proof',
    tool: 'Génération documentaire + checks conformité',
    expectedResult: 'Le dossier est prêt avec des documents exploitables et un niveau de risque visible.',
  },
];

const QUICK_WINS = [
  'Créer des modèles de dossier par procédure pour standardiser le cabinet.',
  'Taguer les emails critiques pour déclencher un rappel automatique.',
  'Utiliser la checklist conformité avant tout envoi client.',
  'Centraliser les pièces dans un dossier unique par client.',
];

export default function DemoCompletePage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const progress = useMemo(
    () => Math.round(((currentIndex + 1) / DEMO_STEPS.length) * 100),
    [currentIndex]
  );

  const currentStep = DEMO_STEPS[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 rounded-2xl border border-indigo-100 bg-white/90 dark:bg-gray-800/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                <Compass className="w-4 h-4" />
                Démo complète guidée
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                Comment utiliser MemoLib de A à Z
              </h1>
            </div>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Voir la démo rapide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-gray-600 dark:text-gray-300 max-w-4xl">
            Ce parcours simule une utilisation réelle d\'un cabinet: vous partez de l\'onboarding, puis vous traitez un flux entrant,
            comprenez le raisonnement IA et finalisez avec les preuves légales.
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-300">Progression</span>
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parcours</h2>
            <div className="space-y-2">
              {DEMO_STEPS.map((step, index) => {
                const isActive = index === currentIndex;
                const isDone = index < currentIndex;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-full text-left rounded-xl px-3 py-3 transition ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isActive ? (
                          <PlayCircle className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{step.duration}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2 inline-flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Durée totale
              </p>
              <p className="text-sm text-indigo-900 dark:text-indigo-200">Environ 8 minutes pour une vue complète.</p>
            </div>
          </aside>

          <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                Étape {currentIndex + 1} / {DEMO_STEPS.length}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {currentStep.duration}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{currentStep.title}</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2 inline-flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Pourquoi
                </p>
                <p className="text-sm text-blue-900">{currentStep.why}</p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-2 inline-flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Résultat attendu
                </p>
                <p className="text-sm text-emerald-900">{currentStep.expectedResult}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-2">Action à faire</p>
              <p className="text-sm text-gray-700 mb-4">{currentStep.action}</p>
              <p className="text-xs text-gray-500">Outil utilisé: {currentStep.tool}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={currentStep.href}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3"
              >
                Lancer cette étape
                <ArrowRight className="w-4 h-4" />
              </Link>

              {currentIndex < DEMO_STEPS.length - 1 && (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Étape suivante
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Bonnes pratiques après la démo
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {QUICK_WINS.map(item => (
              <div key={item} className="rounded-xl border border-gray-200 p-4 bg-gray-50/60">
                <p className="text-sm text-gray-800">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <Link
              href="/demo/email-simulator"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
              Tester les emails
            </Link>
            <Link
              href="/demo/workspace-reasoning"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              Voir le raisonnement
            </Link>
            <Link
              href="/demo/légal-proof"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" />
              Vérifier les preuves
            </Link>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-100">
            <p className="font-medium mb-1 inline-flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Conseil de mise en production
            </p>
            <p className="text-sm text-slate-300">
              Commence par un périmètre simple (emails + checklists), puis active progressivement les automatisations avancées.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
