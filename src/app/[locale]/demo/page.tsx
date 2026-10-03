'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Brain, Scale, ArrowRight, Play, Zap, Compass, Sparkles, Loader2 } from 'lucide-react';

const DEMO_FEATURES = [
  {
    id: 0,
    title: 'Démo complète guidée',
    description: 'Parcours complet pour comprendre comment utiliser MemoLib au quotidien',
    icon: Compass,
    href: '/demo/complete',
    color: 'indigo',
    duration: '8 min',
  },
  {
    id: 1,
    title: 'Email entrant',
    description: 'Simulez des emails clients réalistes avec templates juridiques pré-définis',
    icon: Mail,
    href: '/demo/email-simulator',
    color: 'blue',
    duration: '2 min',
  },
  {
    id: 2,
    title: 'Raisonnement dossier',
    description: 'IA analyse le contenu et organise automatiquement le workflow juridique',
    icon: Brain,
    href: '/demo/workspace-reasoning',
    color: 'purple',
    duration: '3 min',
  },
  {
    id: 3,
    title: 'Preuve légale',
    description: 'Génération automatique de documents avec vérification de conformité',
    icon: Scale,
    href: '/demo/legal-proof',
    color: 'green',
    duration: '2 min',
  },
];

const STATS = [
  { label: 'Temps économisé', value: '75%', description: 'par dossier traité' },
  { label: 'Précision juridique', value: '98%', description: 'conformité légale' },
  { label: 'Satisfaction client', value: '94%', description: 'délais respectés' },
];

const FAKE_RESULT = {
  client: 'Sophie Dubois',
  urgence: 'CRITIQUE',
  type: 'OQTF — Recours contentieux',
  deadline: '14 février 2026 (J-28)',
  action: 'Recours TA sous 30 jours',
};

function WowMomentWidget() {
  const [state, setState] = useState<'idle' | 'analyzing' | 'done'>('idle');

  const run = () => {
    setState('analyzing');
    setTimeout(() => setState('done'), 2200);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="rounded-2xl border border-indigo-200 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">Essayez maintenant — sans inscription</h3>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Email reçu</p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 border">
              <p className="font-medium mb-1">De : sophie.dubois@email.com</p>
              <p className="font-medium mb-2">Objet : URGENT - OQTF notifiée le 15/01</p>
              <p className="text-gray-600 dark:text-gray-400">Bonjour Maître, j'ai reçu une OQTF le 15/01/2026 avec un délai de 30 jours. Je suis en France depuis 5 ans avec mes deux enfants scolarisés...</p>
            </div>
            {state === 'idle' && (
              <button onClick={run} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors">
                <Brain className="w-5 h-5" />
                Analyser avec l'IA
              </button>
            )}
            {state === 'analyzing' && (
              <div className="mt-4 flex items-center gap-2 text-indigo-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Analyse en cours...</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Résultat IA</p>
            {state === 'done' ? (
              <div className="space-y-3 animate-in fade-in">
                {Object.entries({ Client: FAKE_RESULT.client, Urgence: FAKE_RESULT.urgence, Type: FAKE_RESULT.type, Deadline: FAKE_RESULT.deadline, Action: FAKE_RESULT.action }).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-sm text-gray-500">{k}</span>
                    <span className={`text-sm font-semibold ${k === 'Urgence' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{v}</span>
                  </div>
                ))}
                <Link href="/demo/auto-login" className="mt-3 inline-flex items-center gap-2 text-indigo-600 font-medium text-sm hover:text-indigo-800">
                  Voir le parcours complet <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {state === 'idle' ? 'Cliquez "Analyser" pour voir la magie ✨' : 'Extraction en cours...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Démo Interactive MemoLib
            </div>

            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Intelligence Artificielle
              <br />
              <span className="text-blue-600">pour Cabinets d'Avocats</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Découvrez comment MemoLib transforme la gestion des emails clients en workflow juridique intelligent,
              de la réception à la génération de documents légaux.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo/auto-login"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg"
              >
                <Play className="w-5 h-5" />
                Voir MemoLib en action (3 min)
              </Link>
              <Link
                href="/auth/register?plan=PILOT"
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg border border-gray-200"
              >
                <Zap className="w-5 h-5" />
                Essai pilote gratuit (30 jours)
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wow Moment — Instant AI Preview */}
      <WowMomentWidget />

      {/* Demo Steps */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Parcours de Démonstration
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Suivez le processus complet en 3 étapes interactives
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DEMO_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
              indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
              purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
              green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
            };

            return (
              <Link
                key={feature.id}
                href={feature.href}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} opacity-0 group-hover:opacity-10 transition-opacity`} />

                <div className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} text-white mb-6`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {feature.duration}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {feature.description}
                  </p>

                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                    Essayer maintenant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à transformer votre cabinet ?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Découvrez toutes les fonctionnalités de MemoLib dans l'interface complète
          </p>
          <Link
            href="/demo/complete"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg"
          >
            Voir la démo complète guidée
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
