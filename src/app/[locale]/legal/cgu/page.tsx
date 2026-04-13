import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CGU/CGV — MemoLib',
  description: 'Conditions Générales d\'Utilisation et de Vente de MemoLib',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conditions Générales d&apos;Utilisation et de Vente
          </h1>
          <p className="text-gray-500 mb-8">Dernière mise à jour : janvier 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <Section title="1. Objet">
              Les présentes CGU/CGV régissent l&apos;accès et l&apos;utilisation de MemoLib,
              plateforme de gestion des dossiers et communications pour professionnels du droit.
            </Section>

            <Section title="2. Nature du Service">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-amber-800">⚠️ Important</p>
                <p className="text-amber-700 mt-1">
                  MemoLib est un <strong>outil technique de gestion</strong>. Il ne constitue en
                  aucun cas un service de conseil juridique, d&apos;assistance juridique ou de
                  représentation en justice.
                </p>
              </div>
              <p className="mt-4">
                Les fonctionnalités d&apos;intelligence artificielle (classification d&apos;emails,
                extraction d&apos;informations, suggestions) sont des outils d&apos;aide à la
                décision. Elles ne remplacent pas le jugement professionnel de l&apos;avocat et ne
                constituent pas un conseil juridique au sens de la loi du 31 décembre 1971.
              </p>
            </Section>

            <Section title="3. Données et secret professionnel">
              <p>
                Les données saisies restent la <strong>propriété exclusive</strong> du Cabinet.
                Le chiffrement de bout en bout (E2E) garantit que MemoLib ne peut techniquement
                pas accéder au contenu des dossiers, conformément au secret professionnel de
                l&apos;avocat (article 66-5 de la loi du 31 décembre 1971).
              </p>
            </Section>

            <Section title="4. Limitation de responsabilité">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  MemoLib fournit des alertes sur les délais légaux à titre <strong>indicatif</strong>.
                  L&apos;Utilisateur reste seul responsable du respect des délais de procédure.
                </li>
                <li>
                  MemoLib ne saurait être tenu responsable des décisions prises sur la base des
                  suggestions de l&apos;IA.
                </li>
                <li>
                  La responsabilité totale de MemoLib est limitée au montant des sommes versées
                  au cours des 12 derniers mois.
                </li>
              </ul>
            </Section>

            <Section title="5. Hébergement">
              <p>
                Toutes les données sont hébergées dans l&apos;<strong>Union Européenne</strong>{' '}
                (Paris, France). Un hébergement certifié HDS (Hébergeur de Données de Santé) est
                disponible sur demande pour les cabinets traitant des données médicales.
              </p>
            </Section>

            <Section title="6. RGPD">
              <p>
                Le traitement des données personnelles est régi par notre{' '}
                <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                  Politique de confidentialité
                </Link>{' '}
                et l&apos;Accord de traitement des données (DPA) signé lors de la souscription.
              </p>
            </Section>

            <Section title="7. Droit applicable">
              <p>
                Les présentes CGU/CGV sont soumises au droit français. Tout litige sera soumis
                aux tribunaux compétents de Paris.
              </p>
            </Section>

            <div className="border-t pt-6 mt-8 text-sm text-gray-500">
              <p>
                Pour consulter les CGU/CGV complètes, contactez-nous à{' '}
                <a href="mailto:legal@memolib.io" className="text-blue-600 hover:underline">
                  legal@memolib.io
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}
