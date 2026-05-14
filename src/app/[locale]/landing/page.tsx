'use client';

import { useState } from 'react';
import { CheckCircle, Mail, Shield, Zap, Brain, Clock, ArrowRight, Star } from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/beta-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    setSubmitted(true);
    setLoading(false);
  };

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
          <a href="/auth/login" className="text-blue-200 hover:text-white text-sm font-medium transition-colors">
            Se connecter →
          </a>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200 text-sm font-medium">Beta privée — Places limitées</span>
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

          {/* CTA Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? '...' : <>Accès beta <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-xl px-6 py-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-200 font-medium">Inscription reçue ! On vous contacte très vite.</span>
            </div>
          )}

          <p className="text-blue-300/60 text-xs mt-4">Gratuit pendant la beta. Aucune carte bancaire requise.</p>
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
          {[
            { icon: Brain, title: 'IA Juridique', desc: 'Résumé automatique des emails, détection des deadlines, classification des dossiers par type de procédure.' },
            { icon: Mail, title: 'Emails intelligents', desc: 'Vos emails sont automatiquement liés aux bons dossiers. Plus jamais de recherche manuelle.' },
            { icon: Clock, title: 'Délais légaux', desc: 'Alertes automatiques J-7, J-3, J-1 sur les échéances CESEDA, recours, et procédures.' },
            { icon: Shield, title: 'RGPD natif', desc: 'Données chiffrées, audit trail, droit à l\'oubli. Conforme dès le premier jour.' },
            { icon: Zap, title: 'Local-first', desc: 'Vos données restent chez vous. Cloud optionnel. Contrôle total.' },
            { icon: Star, title: 'Multi-cabinet', desc: 'Gestion des rôles, portail client, collaboration entre associés et collaborateurs.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
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
              <p className="text-3xl font-bold text-gray-900">0€</p>
              <p className="text-sm text-gray-500">pendant la beta</p>
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
          Rejoignez les premiers cabinets qui utilisent l&apos;IA au quotidien.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? '...' : "S'inscrire"}
              </button>
            </div>
          </form>
        ) : (
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-6 py-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Vous êtes sur la liste !</span>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 MemoLib. Tous droits réservés.</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-gray-600">Confidentialité</a>
            <a href="/legal/cgu" className="hover:text-gray-600">CGU</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
