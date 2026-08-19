import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap, Shield, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tarifs — MemoLib | Gestion de cabinet d\'avocat par IA',
  description: 'Plans à partir de 29€/mois. IA juridique, gestion dossiers, emails automatiques. 14 jours gratuits.',
};

const PLANS = [
  {
    id: 'PILOT',
    name: 'Découverte',
    price: 0,
    priceYearly: 0,
    period: '',
    description: 'Pour tester MemoLib',
    cta: 'Essai gratuit',
    ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    features: [
      '5 dossiers',
      '5 clients',
      '1 Go stockage',
      'IA basique (regex)',
      '14 jours',
    ],
    limitations: ['Pas d\'IA avancée', 'Pas d\'email automatique'],
    popular: false,
  },
  {
    id: 'SOLO',
    name: 'Solo',
    price: 29,
    priceYearly: 23,
    period: '/mois',
    description: 'L\'avocat indépendant',
    cta: 'Démarrer — 14j gratuits',
    ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25',
    features: [
      '50 dossiers actifs',
      '100 clients',
      '5 Go stockage',
      '✨ IA complète (résumé, brouillon, classification)',
      '✨ Email → Dossier en 1 clic',
      '✨ Délais légaux avec alertes',
      '✨ Génération documents juridiques',
      'Connexion Gmail / Outlook',
      'Recherche jurisprudence',
    ],
    limitations: [],
    popular: true,
  },
  {
    id: 'CABINET',
    name: 'Cabinet',
    price: 79,
    priceYearly: 63,
    period: '/mois',
    description: 'Cabinets 2-10 avocats',
    cta: 'Démarrer — 14j gratuits',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    features: [
      '500 dossiers actifs',
      '1 000 clients',
      '50 Go stockage',
      'Tout Solo +',
      '✨ Jusqu\'à 10 utilisateurs',
      '✨ Comptabilité (CARPA, écritures, TVA)',
      '✨ Brouillon IA contextuel au dossier',
      '✨ Portail client',
      '✨ Analytics avancées',
      'Support prioritaire',
    ],
    limitations: [],
    popular: false,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 199,
    priceYearly: 159,
    period: '/mois',
    description: 'Grands cabinets 10+',
    cta: 'Nous contacter',
    ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    features: [
      'Dossiers illimités',
      'Clients illimités',
      '200 Go stockage',
      'Tout Cabinet +',
      '✨ 50 utilisateurs',
      '✨ API complète',
      '✨ Branding personnalisé',
      '✨ SSO (Azure AD)',
      '✨ SLA garanti',
      'Account manager dédié',
    ],
    limitations: [],
    popular: false,
  },
];

const FAQ = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, upgrade ou downgrade instantané. Le prorata est calculé automatiquement.',
  },
  {
    q: 'Mes données sont-elles en sécurité ?',
    a: 'Chiffrement AES-256, hébergement France (Vercel CDG1), RGPD natif, mode confidentiel par dossier.',
  },
  {
    q: 'L\'IA est-elle obligatoire ?',
    a: 'Non. Vous pouvez utiliser MemoLib sans IA. Le mode confidentiel garantit qu\'aucune donnée ne quitte votre réseau.',
  },
  {
    q: 'Comment fonctionne l\'essai gratuit ?',
    a: '14 jours complets sur le plan choisi. Aucune carte bancaire requise pour commencer. Vous ajoutez le paiement quand vous êtes convaincu.',
  },
  {
    q: 'Quel support est inclus ?',
    a: 'Email pour tous, prioritaire pour Cabinet et Enterprise. Réponse sous 24h (4h pour Enterprise).',
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-lg">MemoLib</span>
        </Link>
        <Link href="/fr/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
          Se connecter →
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Un prix simple, transparent
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          14 jours d&apos;essai gratuit sur tous les plans. Aucune carte bancaire requise.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.popular
                  ? 'border-blue-600 shadow-xl shadow-blue-600/10 scale-[1.02]'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Le plus populaire
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                {plan.priceYearly > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    ou {plan.priceYearly}€/mois en annuel (-20%)
                  </p>
                )}
              </div>

              <Link
                href={plan.id === 'ENTERPRISE' ? '/fr/contact' : `/fr/signup?plan=${plan.id}`}
                className={`block text-center py-3 px-4 rounded-lg font-medium transition mb-6 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className={feature.startsWith('✨') ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {feature.replace('✨ ', '')}
                    </span>
                  </li>
                ))}
                {plan.limitations.map((limit) => (
                  <li key={limit} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="w-4 text-center">—</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <p className="text-sm font-medium">Conforme RGPD</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <p className="text-sm font-medium">Prêt en 2 min</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <p className="text-sm font-medium">Multi-cabinet</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="w-6 h-6 text-blue-600" />
            <p className="text-sm font-medium">Sans engagement</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Questions fréquentes</h2>
        <div className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-gray-100 pb-6">
              <h3 className="font-medium text-gray-900 mb-2">{item.q}</h3>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-16 px-6 bg-blue-600">
        <h2 className="text-3xl font-bold text-white mb-4">
          Prêt à gagner 2h par jour ?
        </h2>
        <p className="text-blue-100 mb-8 max-w-lg mx-auto">
          Rejoignez les avocats qui automatisent leur cabinet avec l&apos;IA.
        </p>
        <Link
          href="/fr/signup"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition"
        >
          Créer mon cabinet gratuitement <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 MemoLib</span>
          <div className="flex gap-4">
            <Link href="/fr/privacy" className="hover:text-gray-600">Confidentialité</Link>
            <Link href="/fr/faq" className="hover:text-gray-600">FAQ</Link>
            <Link href="/fr/contact" className="hover:text-gray-600">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
