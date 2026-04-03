'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Mail, Brain, Scale, ArrowRight, Play, Zap, Compass } from 'lucide-react';

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

export default function DemoHomePage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? 'fr';
  const withLocale = (path: string) => `/${locale}${path}`;

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
                href="/auth/register?plan=PILOT"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg"
              >
                <Zap className="w-5 h-5" />
                Essai pilote gratuit (30 jours)
              </Link>
              <Link
                href={withLocale('/demo/complete')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg"
              >
                <Play className="w-5 h-5" />
                Lancer la démo complète
              </Link>
              <Link
                href={withLocale('/demo/email-simulator')}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg border border-gray-200"
              >
                Démo rapide (3 étapes)
                <ArrowRight className="w-5 h-5" />
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
                href={withLocale(feature.href)}
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
            href={withLocale('/demo/complete')}
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
