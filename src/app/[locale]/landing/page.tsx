import type { Metadata } from 'next';
import { Mail, Shield, Zap, Brain, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MemoLib — Gestion de cabinet d\'avocat par IA',
  description: 'L\'assistant IA qui gère votre cabinet. Emails, dossiers, deadlines, documents. Prêt en 2 minutes, aucune installation.',
  openGraph: {
    title: 'MemoLib — Gestion de cabinet d\'avocat par IA',
    description: 'L\'assistant IA qui gère votre cabinet d\'avocat.',
    type: 'website',
    url: 'https://memolib.space/fr/landing',
  },
  alternates: {
    canonical: 'https://memolib.space/fr/landing',
  },
};

const features = [
  { icon: Brain, title: 'IA Juridique', desc: 'Résumé automatique des emails, détection des deadlines, classification des dossiers par type de procédure.' },
  { icon: Mail, title: 'Emails intelligents', desc: 'Vos emails sont automatiquement liés aux bons dossiers. Plus jamais de recherche manuelle.' },
  { icon: Clock, title: 'Délais légaux', desc: 'Alertes automatiques J-7, J-3, J-1 sur les échéances CESEDA, recours, et procédures.' },
  { icon: Shield, title: 'RGPD natif', desc: 'Données chiffrées, audit trail, droit à l\'oubli. Conforme dès le premier jour.' },
  { icon: Zap, title: 'Local-first', desc: 'Vos données restent chez vous. Cloud optionnel. Contrôle total.' },
  { icon: Star, title: 'Multi-cabinet', desc: 'Gestion des rôles, portail client, collaboration entre associés et collaborateurs.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-semibold text-lg">MemoLib</span>
          </div>
          <a href="/fr/auth/login" className="text-blue-200 hover:text-white text-sm font-medium transition-colors">
            Se connecter →
          </a>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200 text-sm font-medium">14 jours d&apos;essai gratuit — Prêt en 2 minutes</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            L&apos;assistant IA qui<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              gère votre cabinet
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            MemoLib analyse vos emails, crée vos dossiers, détecte les deadlines et vous fait gagner 2h par jour. Conçu par et pour les avocats.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/fr/signup"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg shadow-blue-500/25"
            >
              Créer mon cabinet gratuitement
              <Zap className="w-5 h-5" />
            </Link>
            <Link
              href="/fr/demo/avocat"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-4 rounded-xl transition-colors border border-white/20"
            >
              Voir la démo →
            </Link>
          </div>

          <p className="text-blue-300/60 text-xs mt-4">Aucune carte bancaire requise • Aucune installation</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Tout ce dont votre cabinet a besoin
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Une plateforme unique qui remplace 5 outils différents
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-wide mb-6">Conçu pour les professionnels du droit</p>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-3xl font-bold text-gray-900">2h</p>
              <p className="text-sm text-gray-500">gagnées par jour</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-500">RGPD conforme</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">29€</p>
              <p className="text-sm text-gray-500">par mois (Solo)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Prêt à moderniser votre cabinet ?
        </h2>
        <p className="text-gray-500 mb-8">
          Créez votre espace en 2 minutes. L&apos;IA est déjà active, aucune installation requise.
        </p>
        <Link
          href="/fr/signup"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
        >
          Démarrer mon essai gratuit →
        </Link>
        <p className="text-gray-400 text-sm mt-4">14 jours gratuits • Sans engagement • À partir de 29€/mois</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 MemoLib. Tous droits réservés.</span>
          <div className="flex gap-4">
            <a href="/fr/privacy" className="hover:text-gray-600">Confidentialité</a>
            <a href="/fr/faq" className="hover:text-gray-600">FAQ</a>
            <a href="/fr/contact" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
