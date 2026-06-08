import type { Metadata } from 'next';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export const metadata: Metadata = {
  title: 'OQTF : délais de recours et procédure — Guide avocat | MemoLib',
  description: 'Tout savoir sur les délais OQTF : 48h pour le recours suspensif, 30 jours pour le recours classique. Calcul automatique des échéances avec MemoLib.',
  keywords: [
    'OQTF délai recours',
    'OQTF 48h',
    'OQTF 30 jours',
    'recours OQTF',
    'obligation quitter territoire',
    'délai contestation OQTF',
    'avocat droit des étrangers',
    'CESEDA délais',
  ],
  openGraph: {
    title: 'OQTF : délais de recours et procédure — Guide avocat',
    description: 'Guide complet sur les délais OQTF pour avocats en droit des étrangers. Calcul automatique avec MemoLib.',
    type: 'article',
    url: 'https://memolib.space/fr/oqtf-delais-recours',
  },
  alternates: {
    canonical: 'https://memolib.space/fr/oqtf-delais-recours',
  },
};

const delais = [
  { type: 'OQTF sans délai de départ volontaire', delai: '48 heures', recours: 'Recours suspensif devant le TA', urgence: 'critique' },
  { type: 'OQTF avec délai de départ volontaire (30j)', delai: '30 jours', recours: 'Recours en annulation devant le TA', urgence: 'haute' },
  { type: 'Interdiction de retour (IRTF)', delai: '48h ou 30j (selon OQTF)', recours: 'Contesté avec l\'OQTF', urgence: 'haute' },
  { type: 'Assignation à résidence', delai: '48 heures', recours: 'Recours devant le JLD ou TA', urgence: 'critique' },
  { type: 'Refus de titre de séjour', delai: '2 mois', recours: 'Recours gracieux ou contentieux', urgence: 'moyenne' },
  { type: 'Rétention administrative', delai: '48 heures', recours: 'Saisine du JLD', urgence: 'critique' },
];

export default function OQTFDelaisPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      {/* Hero */}
      <section className="bg-gradient-to-b from-red-900 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-full px-4 py-1.5 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-300" />
            <span className="text-red-200 text-sm font-medium">Guide pratique pour avocats</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            OQTF : délais de recours<br />et procédure complète
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Les délais en droit des étrangers sont stricts. Une échéance ratée = un client expulsé. Voici le guide complet.
          </p>
        </div>
      </section>

      {/* Tableau des délais */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Tableau récapitulatif des délais</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-4 px-4 text-gray-700 font-semibold border-b-2">Type de décision</th>
                <th className="py-4 px-4 text-gray-700 font-semibold border-b-2">Délai de recours</th>
                <th className="py-4 px-4 text-gray-700 font-semibold border-b-2">Type de recours</th>
                <th className="py-4 px-4 text-gray-700 font-semibold border-b-2">Urgence</th>
              </tr>
            </thead>
            <tbody>
              {delais.map((d) => (
                <tr key={d.type} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{d.type}</td>
                  <td className="py-4 px-4">
                    <span className={`font-bold ${d.urgence === 'critique' ? 'text-red-600' : d.urgence === 'haute' ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {d.delai}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{d.recours}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.urgence === 'critique' ? 'bg-red-100 text-red-700' :
                      d.urgence === 'haute' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {d.urgence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contenu SEO */}
      <section className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-lg">
        <h2>Qu'est-ce qu'une OQTF ?</h2>
        <p>
          L'Obligation de Quitter le Territoire Français (OQTF) est une décision administrative prise par le préfet. 
          Elle oblige un étranger en situation irrégulière à quitter la France dans un délai déterminé.
        </p>
        <p>
          Le Code de l'entrée et du séjour des étrangers (CESEDA) distingue deux types d'OQTF : 
          avec délai de départ volontaire (30 jours) et sans délai (exécution immédiate).
        </p>

        <h2>OQTF sans délai : le recours en 48h</h2>
        <p>
          Lorsque l'OQTF est assortie d'une absence de délai de départ volontaire (article L. 612-2 CESEDA), 
          le recours doit être introduit dans les <strong>48 heures</strong> suivant la notification. 
          Ce recours est suspensif : l'éloignement ne peut pas être exécuté tant que le tribunal n'a pas statué.
        </p>
        <p>
          Le tribunal administratif statue dans un délai de 96 heures en formation à juge unique.
        </p>

        <h2>OQTF avec délai de 30 jours</h2>
        <p>
          Lorsqu'un délai de départ volontaire de 30 jours est accordé, le recours en annulation doit être 
          formé dans un délai de <strong>30 jours</strong> suivant la notification. Ce recours n'est pas suspensif 
          par défaut : il faut demander un référé-suspension en parallèle.
        </p>

        <h2>Comment ne jamais rater un délai OQTF ?</h2>
        <p>
          Avec MemoLib, les délais sont calculés automatiquement dès la réception de l'email client. 
          Le système détecte le type de procédure, calcule l'échéance, et vous alerte à J-7, J-3 et J-1.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ne ratez plus jamais un délai OQTF</h2>
          <p className="text-slate-300 mb-8">MemoLib calcule automatiquement vos échéances et vous alerte avant chaque deadline.</p>
          <Link href="/auth/register?plan=PILOT" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2">
            Essai gratuit 14 jours <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 MemoLib</span>
          <div className="flex gap-4">
            <Link href="/fr/logiciel-avocat" className="hover:text-gray-600">Logiciel avocat</Link>
            <Link href="/fr/gestion-cabinet-avocat" className="hover:text-gray-600">Guide cabinet</Link>
            <Link href="/fr/pricing" className="hover:text-gray-600">Tarifs</Link>
            <Link href="/fr/contact" className="hover:text-gray-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
