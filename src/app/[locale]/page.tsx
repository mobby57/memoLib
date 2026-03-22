'use client';

import Link from 'next/link';
import {
  Mail, Brain, Scale, Shield, Clock, Users, Zap, ArrowRight,
  CheckCircle, BarChart3, FileText, Bell, Calendar, Lock,
  Globe, Star, ChevronRight
} from 'lucide-react';

const PAIN_POINTS = [
  {
    icon: Mail,
    title: '50+ emails/jour',
    description: 'Tri manuel, classement, extraction des infos clients. Des heures perdues chaque jour.',
  },
  {
    icon: Clock,
    title: 'Délais OQTF ratés',
    description: "48h pour contester, 15 jours pour un recours. Une échéance oubliée = un client expulsé.",
  },
  {
    icon: FileText,
    title: 'Dossiers éparpillés',
    description: "Emails dans Gmail, notes sur papier, documents sur le bureau. Aucune vue d'ensemble.",
  },
];

const FEATURES = [
  {
    icon: Mail,
    title: 'Inbox intelligent',
    description: "Vos emails clients triés, classés et analysés automatiquement. Extraction des coordonnées, détection d'urgence.",
    color: 'blue',
  },
  {
    icon: Brain,
    title: 'IA spécialisée CESEDA',
    description: "Calcul automatique des délais légaux, suggestions de procédure, analyse du dossier en temps réel.",
    color: 'purple',
  },
  {
    icon: Scale,
    title: 'Workflow juridique',
    description: "De la réception de l'email à la clôture du dossier. Statuts, priorités, échéances, tout est tracé.",
    color: 'green',
  },
  {
    icon: Bell,
    title: 'Alertes échéances',
    description: "Plus jamais un délai raté. Alertes automatiques pour OQTF, recours, audiences, rendez-vous préfecture.",
    color: 'red',
  },
  {
    icon: FileText,
    title: 'Documents & preuves',
    description: "Génération automatique de documents, horodatage légal, signatures électroniques eIDAS.",
    color: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord',
    description: "Vue d'ensemble de votre cabinet : dossiers en cours, échéances, facturation, performance.",
    color: 'indigo',
  },
];

const TESTIMONIALS = [
  {
    quote: "Avant MemoLib, je passais 3h par jour à trier mes emails. Maintenant c'est 15 minutes.",
    author: "Maître D.",
    role: "Avocate en droit des étrangers, Paris",
    rating: 5,
  },
  {
    quote: "L'alerte OQTF m'a sauvé un dossier. 48h de délai, j'aurais oublié sans MemoLib.",
    author: "Maître K.",
    role: "Avocat au barreau de Lyon",
    rating: 5,
  },
  {
    quote: "Mes clients ont un espace dédié pour suivre leur dossier. Moins d'appels, plus de confiance.",
    author: "Maître S.",
    role: "Cabinet spécialisé immigration, Marseille",
    rating: 5,
  },
];

const PRICING = [
  {
    name: 'Pilote',
    price: 'Gratuit',
    period: '30 jours',
    description: 'Testez MemoLib sans engagement',
    features: [
      '50 dossiers',
      'Inbox intelligent',
      'Alertes échéances',
      'Support email',
    ],
    cta: 'Essai gratuit',
    href: '/auth/register?plan=PILOT',
    highlighted: false,
  },
  {
    name: 'Professionnel',
    price: '49€',
    period: '/mois',
    description: 'Pour les avocats indépendants',
    features: [
      'Dossiers illimités',
      'IA spécialisée CESEDA',
      'Signatures électroniques',
      'Espace client dédié',
      'Facturation intégrée',
      'Support prioritaire',
    ],
    cta: 'Commencer',
    href: '/auth/register?plan=PRO',
    highlighted: true,
  },
  {
    name: 'Cabinet',
    price: '149€',
    period: '/mois',
    description: 'Pour les cabinets multi-avocats',
    features: [
      'Tout Professionnel +',
      'Multi-utilisateurs (10)',
      'Rôles et permissions',
      'Analytics avancés',
      'API & intégrations',
      'Support dédié',
    ],
    cta: 'Nous contacter',
    href: '/contact',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">{'\u2696\uFE0F'}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MemoLib</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600 dark:text-gray-300">
            <a href="#fonctionnalites" className="hover:text-gray-900 dark:hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-gray-900 dark:hover:text-white transition-colors">Tarifs</a>
            <a href="#temoignages" className="hover:text-gray-900 dark:hover:text-white transition-colors">Témoignages</a>
            <Link href="/demo" className="hover:text-gray-900 dark:hover:text-white transition-colors">Démo</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/auth/register?plan=PILOT"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Spécialisé droit des étrangers & CESEDA
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Votre cabinet d'avocat,
            <br />
            <span className="text-blue-600">enfin organisé.</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            MemoLib transforme vos emails clients en dossiers structurés, calcule vos délais OQTF automatiquement,
            et vous alerte avant chaque échéance. Zéro email perdu, zéro délai raté.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/register?plan=PILOT"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-blue-600/25"
            >
              Essai pilote gratuit — 30 jours
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo/complete"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              Voir la démo
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-500" />
              RGPD natif
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-green-500" />
              Chiffrement AES-256
            </span>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Vous perdez du temps chaque jour
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Les cabinets spécialisés en droit des étrangers font face à des défis uniques.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {PAIN_POINTS.map((point, i) => {
              const Icon = point.icon;
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{point.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{point.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Tout ce dont votre cabinet a besoin
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Une plateforme complète, conçue par et pour les avocats en droit des étrangers.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
              };
              return (
                <div key={i} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[feature.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '75%', label: 'Temps économisé' },
            { value: '0', label: 'Délai raté' },
            { value: '98%', label: 'Conformité CESEDA' },
            { value: '<5min', label: 'Création dossier' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold mb-1">{stat.value}</div>
              <div className="text-blue-100 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Ils utilisent MemoLib au quotidien
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{t.author}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Tarifs simples, sans surprise
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
            Commencez gratuitement. Évoluez quand vous êtes prêt.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {PRICING.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25 scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-sm font-medium mb-2 opacity-80">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm opacity-70">{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Vos données sont sacrées
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Secret professionnel oblige. MemoLib est conçu pour la confidentialité absolue.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'RGPD natif' },
              { icon: Lock, label: 'Chiffrement AES-256' },
              { icon: Globe, label: 'Hébergement EU' },
              { icon: Users, label: 'Isolation par cabinet' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-3 p-6">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à transformer votre cabinet ?
          </h2>
          <p className="text-gray-300 mb-8">
            Rejoignez les avocats qui gagnent 3 heures par jour avec MemoLib.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?plan=PILOT"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              Démarrer l'essai gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo/complete"
              className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              Voir la démo interactive
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'\u2696\uFE0F'}</span>
            <span className="font-bold text-gray-900 dark:text-white">MemoLib</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{'\u00A9'} 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/faq" className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</Link>
            <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
            <Link href="/demo" className="hover:text-gray-900 dark:hover:text-white transition-colors">Démo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
