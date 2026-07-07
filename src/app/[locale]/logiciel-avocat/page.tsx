import type { Metadata } from 'next';
import { ArrowRight, Brain, Clock, FileText, Mail, Shield, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export const metadata: Metadata = {
  title: 'Logiciel de gestion pour cabinet d\'avocat — MemoLib',
  description: 'MemoLib est le logiciel de gestion complet pour cabinets d\'avocats : dossiers, emails, délais légaux, facturation et IA intégrée. RGPD natif, multi-cabinet.',
  keywords: [
    'logiciel avocat',
    'logiciel gestion cabinet avocat',
    'logiciel juridique',
    'gestion dossiers avocat',
    'facturation avocat',
    'logiciel cabinet juridique',
    'SaaS avocat',
    'outil avocat',
  ],
  openGraph: {
    title: 'Logiciel de gestion pour cabinet d\'avocat — MemoLib',
    description: 'Gérez vos dossiers, emails, délais et factures depuis une seule plateforme. IA intégrée. RGPD natif.',
    type: 'website',
    url: 'https://memolib.space/fr/logiciel-avocat',
  },
  alternates: {
    canonical: 'https://memolib.space/fr/logiciel-avocat',
    languages: {
      fr: 'https://memolib.space/fr/logiciel-avocat',
      en: 'https://memolib.space/en/logiciel-avocat',
    },
  },
};

const features = [
  { icon: FileText, title: 'Gestion des dossiers', desc: 'Créez, suivez et archivez vos dossiers avec un workflow complet : statuts, priorités, échéances, attribution aux collaborateurs.' },
  { icon: Mail, title: 'Emails connectés', desc: 'Vos emails sont automatiquement rattachés aux dossiers correspondants. Fini la recherche manuelle dans Gmail.' },
  { icon: Clock, title: 'Délais légaux automatiques', desc: 'Calcul automatique des échéances CESEDA, OQTF, recours. Alertes J-7, J-3, J-1 pour ne jamais rater un délai.' },
  { icon: Brain, title: 'Intelligence artificielle', desc: 'Résumé automatique des emails, classification des dossiers, brouillon de réponse, recherche jurisprudence.' },
  { icon: Users, title: 'Multi-cabinet et rôles', desc: '9 rôles (associé, collaborateur, stagiaire, secrétaire...). Chaque cabinet a son espace isolé.' },
  { icon: Shield, title: 'RGPD et sécurité', desc: 'Chiffrement AES-256, audit trail chaîné, droit à l\'oubli, anonymisation. Hébergement EU.' },
];

const comparisons = [
  { name: 'Gestion dossiers', memolib: true, generic: true, excel: false },
  { name: 'Emails intégrés', memolib: true, generic: false, excel: false },
  { name: 'Délais légaux auto', memolib: true, generic: false, excel: false },
  { name: 'IA juridique', memolib: true, generic: false, excel: false },
  { name: 'RGPD natif', memolib: true, generic: true, excel: false },
  { name: 'Multi-cabinet', memolib: true, generic: true, excel: false },
  { name: 'Spécialisé droit étrangers', memolib: true, generic: false, excel: false },
];

export default function LogicielAvocatPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Le logiciel de gestion<br />
            <span className="text-blue-400">conçu pour les avocats</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            MemoLib centralise vos dossiers, emails, délais et factures dans une seule plateforme. Avec l'IA en plus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?plan=PILOT" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2">
              Essai gratuit 14 jours <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/fr/demo" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors">
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      {/* Problème / Solution */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Pourquoi les cabinets choisissent MemoLib
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Les outils génériques ne comprennent pas les contraintes d'un cabinet d'avocats : délais légaux stricts, secret professionnel, workflow spécifique.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparatif */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            MemoLib vs. les alternatives
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-4 px-4 text-gray-700">Fonctionnalité</th>
                  <th className="py-4 px-4 text-center text-blue-600 font-bold">MemoLib</th>
                  <th className="py-4 px-4 text-center text-gray-500">Logiciel générique</th>
                  <th className="py-4 px-4 text-center text-gray-500">Excel / Drive</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">{c.name}</td>
                    <td className="py-3 px-4 text-center">{c.memolib ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="py-3 px-4 text-center">{c.generic ? <span className="text-green-600">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="py-3 px-4 text-center">{c.excel ? <span className="text-green-600">✓</span> : <span className="text-red-400">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Prêt à essayer ?</h2>
        <p className="text-gray-500 mb-8">14 jours gratuits, sans carte bancaire. Données importables depuis votre outil actuel.</p>
        <Link href="/auth/register?plan=PILOT" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2">
          Démarrer l'essai gratuit <ArrowRight className="w-5 h-5" />
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
    </div>
  );
}
