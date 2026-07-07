import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export const metadata: Metadata = {
  title: 'Gestion de cabinet d\'avocat : le guide complet | MemoLib',
  description: 'Comment bien gérer un cabinet d\'avocat en 2026 : outils, organisation des dossiers, facturation, délais légaux et automatisation par IA.',
  keywords: [
    'gestion cabinet avocat',
    'organisation cabinet juridique',
    'outil gestion avocat',
    'productivité avocat',
    'automatisation cabinet',
    'facturation avocat',
    'gestion dossiers juridiques',
  ],
  openGraph: {
    title: 'Gestion de cabinet d\'avocat : le guide complet',
    description: 'Bonnes pratiques et outils pour gérer efficacement un cabinet d\'avocat moderne.',
    type: 'article',
    url: 'https://memolib.space/fr/gestion-cabinet-avocat',
  },
  alternates: {
    canonical: 'https://memolib.space/fr/gestion-cabinet-avocat',
  },
};

export default function GestionCabinetPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-900 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Gestion de cabinet d'avocat :<br />
            <span className="text-indigo-300">le guide complet 2026</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Organisation, outils, facturation et automatisation : tout ce qu'il faut savoir pour gérer un cabinet moderne.
          </p>
        </div>
      </section>

      {/* Contenu */}
      <article className="max-w-3xl mx-auto px-6 py-16 prose prose-gray prose-lg">
        <h2>Les 5 piliers d'un cabinet bien géré</h2>
        <p>
          Un cabinet d'avocat efficace repose sur 5 axes fondamentaux : la gestion des dossiers, 
          la communication client, le respect des délais, la facturation, et la conformité réglementaire.
        </p>

        <h3>1. Gestion centralisée des dossiers</h3>
        <p>
          Chaque dossier doit avoir un cycle de vie clair : ouverture, instruction, audience, clôture, archivage.
          Un bon logiciel permet de suivre l'état de chaque dossier, d'attribuer des tâches aux collaborateurs,
          et d'avoir une vision d'ensemble instantanée.
        </p>
        <p>
          <strong>Erreur fréquente :</strong> utiliser des dossiers papier ou des tableurs Excel. 
          Aucune traçabilité, aucun rappel automatique, risque de perte d'information.
        </p>

        <h3>2. Communication client structurée</h3>
        <p>
          Les emails sont le nerf de la guerre dans un cabinet. Chaque email doit être relié au bon dossier, 
          au bon client. Les outils modernes permettent de rattacher automatiquement un email entrant 
          au dossier correspondant grâce à l'analyse du contenu.
        </p>

        <h3>3. Respect des délais légaux</h3>
        <p>
          En droit des étrangers, un délai raté peut signifier l'expulsion d'un client. 
          En droit civil, c'est la prescription. En droit pénal, c'est la nullité de procédure.
          Un système d'alertes automatiques est indispensable.
        </p>

        <h3>4. Facturation transparente</h3>
        <p>
          Le suivi du temps passé, la génération de factures, le suivi des paiements et les relances 
          doivent être automatisés. Un avocat qui passe 30 minutes par jour sur sa facturation perd 
          10 heures par mois — soit l'équivalent d'un jour et demi de travail.
        </p>

        <h3>5. Conformité RGPD et secret professionnel</h3>
        <p>
          Les données des clients sont des données sensibles. Le cabinet doit garantir le chiffrement, 
          la traçabilité des accès, et la possibilité d'exercer le droit à l'oubli. 
          Un audit trail chaîné (hash chain) permet de prouver l'intégrité des données en cas de contrôle.
        </p>

        <h2>L'apport de l'IA dans la gestion d'un cabinet</h2>
        <p>
          En 2026, l'intelligence artificielle permet aux avocats d'automatiser les tâches répétitives :
        </p>
        <ul>
          <li><strong>Résumé automatique d'emails</strong> — extraction du client, de l'urgence, du type de procédure</li>
          <li><strong>Classification des dossiers</strong> — OQTF, titre de séjour, asile, naturalisation</li>
          <li><strong>Brouillon de réponse</strong> — proposition de réponse contextualisée au dossier</li>
          <li><strong>Recherche jurisprudence</strong> — interrogation de Légifrance en langage naturel</li>
        </ul>

        <h2>Choisir le bon outil</h2>
        <p>
          Un logiciel de gestion pour avocats doit être :
        </p>
        <ul>
          <li>Spécialisé (pas un CRM générique)</li>
          <li>Conforme RGPD (hébergement EU, chiffrement)</li>
          <li>Intégré (emails + dossiers + facturation en un seul outil)</li>
          <li>Simple à prendre en main (un avocat n'est pas un informaticien)</li>
        </ul>
      </article>

      {/* CTA */}
      <section className="bg-indigo-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Testez MemoLib gratuitement</h2>
          <p className="text-indigo-200 mb-8">Le logiciel conçu par et pour les avocats. 14 jours d'essai, sans engagement.</p>
          <Link href="/auth/register?plan=PILOT" className="px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-colors inline-flex items-center gap-2">
            Démarrer l'essai <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 MemoLib</span>
          <div className="flex gap-4">
            <Link href="/fr/logiciel-avocat" className="hover:text-gray-600">Logiciel avocat</Link>
            <Link href="/fr/oqtf-delais-recours" className="hover:text-gray-600">Délais OQTF</Link>
            <Link href="/fr/pricing" className="hover:text-gray-600">Tarifs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
