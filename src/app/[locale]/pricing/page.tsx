'use client';

export const dynamic = 'force-dynamic';

/**
 * Page Tarifs - Presentation des plans et fonctionnalites
 */

import {
  ArrowLeft,
  Brain,
  Building,
  Check,
  Clock,
  Crown,
  FileText,
  Headphones,
  Shield,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    id: 'SOLO',
    name: 'Solo',
    description: 'Pour les avocats independants',
    price: 49,
    priceAnnual: 39,
    popular: false,
    icon: Zap,
    color: 'blue',
    features: [
      { name: '20 clients maximum', included: true },
      { name: '50 dossiers', included: true },
      { name: '1 utilisateur', included: true },
      { name: '5 GB stockage', included: true },
      { name: 'Analyse IA basique', included: true },
      { name: 'Support email', included: true },
      { name: 'Multi-utilisateurs', included: false },
      { name: 'API PISTE', included: false },
      { name: 'Support prioritaire', included: false },
      { name: 'Formation personnalisee', included: false },
    ],
  },
  {
    id: 'CABINET',
    name: 'Cabinet',
    description: 'Pour les petits et moyens cabinets',
    price: 349,
    priceAnnual: 279,
    popular: true,
    icon: Building,
    color: 'indigo',
    features: [
      { name: '100 clients maximum', included: true },
      { name: '300 dossiers', included: true },
      { name: '5 utilisateurs', included: true },
      { name: '50 GB stockage', included: true },
      { name: 'Analyse IA avancee', included: true },
      { name: 'Support email + chat', included: true },
      { name: 'Multi-utilisateurs', included: true },
      { name: 'Workflows automatises', included: true },
      { name: 'API PISTE', included: false },
      { name: 'Formation personnalisee', included: false },
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Pour les grands cabinets',
    price: 599,
    priceAnnual: 479,
    popular: false,
    icon: Crown,
    color: 'purple',
    features: [
      { name: 'Clients illimites', included: true },
      { name: 'Dossiers illimites', included: true },
      { name: 'Utilisateurs illimites', included: true },
      { name: '500 GB stockage', included: true },
      { name: 'IA personnalisee + GPT-4', included: true },
      { name: 'Support 24/7 dedie', included: true },
      { name: 'Multi-utilisateurs', included: true },
      { name: 'Workflows avances', included: true },
      { name: 'API PISTE integree', included: true },
      { name: 'Formation sur site', included: true },
    ],
  },
];

const FEATURES_DETAILS = [
  {
    icon: Brain,
    title: 'Analyse Intelligente',
    description:
      'Analyse automatique des emails, classification des dossiers, suggestions intelligentes',
  },
  {
    icon: FileText,
    title: 'Gestion Documentaire',
    description: 'Stockage securise, OCR, recherche dans le contenu des documents',
  },
  {
    icon: Users,
    title: 'Multi-Tenant',
    description: 'Chaque cabinet est isole avec ses propres donnees et utilisateurs',
  },
  {
    icon: Shield,
    title: 'Securite RGPD',
    description: 'Chiffrement bout en bout, hebergement en France, conformite totale',
  },
  {
    icon: Clock,
    title: 'Automatisation',
    description: 'Workflows configurable, rappels automatiques, notifications temps reel',
  },
  {
    icon: Headphones,
    title: 'Support Reactif',
    description: 'Equipe francaise disponible par email, chat et telephone',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-blue-300 hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/auth/login" className="text-blue-300 hover:text-white transition-colors">
              Connexion
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Tarifs simples et transparents
        </h1>
        <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-8">
          Choisissez le plan adapte a la taille de votre cabinet. Tous les plans incluent 14 jours
          d'essai gratuit.
        </p>
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm">
          <Star className="w-4 h-4" />
          -20% sur l'abonnement annuel
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-white/10 backdrop-blur-lg rounded-2xl border ${
                  plan.popular ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-white/20'
                } overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm font-medium">
                    Le plus populaire
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 bg-${plan.color}-500/20 rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 text-${plan.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">{plan.price}€</span>
                      <span className="text-gray-400">/mois</span>
                    </div>
                    <p className="text-sm text-green-400">ou {plan.priceAnnual}€/mois (annuel)</p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/auth/register?plan=${plan.id}`}
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-colors mb-8 ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Commencer l'essai gratuit
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-200' : 'text-gray-500'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Details */}
      <div className="bg-white/5 border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Toutes les fonctionnalites incluses
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES_DETAILS.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Questions frequentes</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Puis-je changer de plan a tout moment ?',
                a: 'Oui, vous pouvez upgrader ou downgrader votre plan a tout moment. La difference sera calculee au prorata.',
              },
              {
                q: 'Les donnees sont-elles securisees ?',
                a: 'Absolument. Toutes les donnees sont chiffrees et hebergees en France, en conformite avec le RGPD.',
              },
              {
                q: 'Y a-t-il un engagement ?',
                a: "Non, vous pouvez annuler a tout moment. L'abonnement annuel offre simplement une reduction de 20%.",
              },
              {
                q: "Comment fonctionne l'essai gratuit ?",
                a: "Vous beneficiez de 14 jours d'acces complet sans carte bancaire. A la fin, vous choisissez votre plan.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pret a transformer votre cabinet ?</h2>
          <p className="text-blue-100 mb-8">
            Rejoignez les centaines d'avocats qui font confiance à memoLib
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Demander une demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
