import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CGU/CGV - MemoLib',
  description: 'Conditions Generales d\'Utilisation et de Vente de MemoLib',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Generales d&apos;Utilisation et de Vente</h1>
          <p className="text-gray-500 mb-8">Derniere mise a jour : mai 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 1 - Objet</h2>
              <p>Les presentes CGU/CGV regissent l&apos;utilisation de la plateforme MemoLib, editee par MD Conseils SAS, 86 Rue aux Arenes, 57000 Metz, France. MemoLib est un logiciel SaaS de gestion de cabinet d&apos;avocats specialise en droit des etrangers.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 2 - Definitions</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Plateforme</strong> : le service MemoLib accessible a l&apos;adresse memolib.space</li>
                <li><strong>Utilisateur</strong> : toute personne physique ou morale inscrite sur la Plateforme</li>
                <li><strong>Abonnement</strong> : formule payante donnant acces aux fonctionnalites de la Plateforme</li>
                <li><strong>Contenu</strong> : donnees, documents et informations saisies par l&apos;Utilisateur</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 3 - Inscription et compte</h2>
              <p>L&apos;inscription est reservee aux professionnels du droit (avocats, notaires, juristes). L&apos;Utilisateur garantit l&apos;exactitude des informations fournies. Le compte est personnel et ne peut etre cede. L&apos;Utilisateur est responsable de la confidentialite de ses identifiants.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 4 - Abonnements et tarifs</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Essentiel</strong> : 89 EUR/mois (1 utilisateur, 50 dossiers)</li>
                <li><strong>Cabinet</strong> : 69 EUR/utilisateur/mois (3-10 utilisateurs, 200 dossiers)</li>
                <li><strong>Premium</strong> : 149 EUR/utilisateur/mois (5-20 utilisateurs, illimite)</li>
              </ul>
              <p className="mt-2">Les prix sont HT. La TVA applicable est celle en vigueur au jour de la facturation. L&apos;abonnement est mensuel ou annuel (-20%), sans engagement minimum. La facturation est automatique via Stripe.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 5 - Essai gratuit</h2>
              <p>Un essai gratuit de 14 jours est propose sans carte bancaire. A l&apos;issue de l&apos;essai, l&apos;Utilisateur doit souscrire un abonnement pour continuer a utiliser le service. Les donnees sont conservees 30 jours apres la fin de l&apos;essai.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 6 - Resiliation</h2>
              <p>L&apos;Utilisateur peut resilier son abonnement a tout moment depuis son espace. La resiliation prend effet a la fin de la periode en cours. Aucun remboursement prorata n&apos;est effectue. Les donnees sont exportables pendant 30 jours apres resiliation, puis supprimees.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 7 - Propriete des donnees</h2>
              <p>L&apos;Utilisateur reste proprietaire de l&apos;integralite de ses donnees. MemoLib n&apos;acquiert aucun droit sur le Contenu. Les donnees ne sont jamais utilisees a des fins commerciales, publicitaires ou d&apos;entrainement de modeles IA. L&apos;Utilisateur peut exporter ses donnees a tout moment (droit a la portabilite RGPD).</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 8 - Intelligence artificielle</h2>
              <p>MemoLib integre des fonctionnalites d&apos;IA (resume, classification, suggestions). Ces fonctionnalites sont des outils d&apos;aide et ne constituent en aucun cas un conseil juridique. L&apos;Utilisateur reste seul responsable des decisions prises sur la base des suggestions IA. Voir notre <Link href="/fr/charte-ia" className="text-blue-600 hover:underline">Charte IA</Link> pour plus de details.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 9 - Secret professionnel</h2>
              <p>MemoLib garantit le respect du secret professionnel (art. 66-5 loi du 31 decembre 1971). Les donnees sont isolees par cabinet (multi-tenant), chiffrees (AES-256), et aucun employe de MemoLib n&apos;a acces au contenu des dossiers sans autorisation explicite de l&apos;Utilisateur.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 10 - Protection des donnees (RGPD)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Responsable de traitement : MD Conseils SAS</li>
                <li>Hebergement : Union Europeenne (Vercel EU, Neon PostgreSQL EU)</li>
                <li>Duree de conservation : duree de l&apos;abonnement + 30 jours</li>
                <li>Droits : acces, rectification, suppression, portabilite, opposition</li>
                <li>Contact DPO : sarraboudjellal57@gmail.com</li>
              </ul>
              <p className="mt-2">Voir notre <Link href="/fr/privacy" className="text-blue-600 hover:underline">Politique de confidentialite</Link> pour le detail des traitements.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 11 - Disponibilite et SLA</h2>
              <p>MemoLib s&apos;engage sur une disponibilite de 99,9% (hors maintenance programmee). En cas d&apos;indisponibilite superieure a 4h consecutives, l&apos;Utilisateur peut demander un avoir au prorata. MemoLib n&apos;est pas responsable des interruptions dues a des tiers (hebergeur, fournisseur internet).</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 12 - Responsabilite</h2>
              <p>MemoLib est un outil de gestion. Il ne se substitue pas a l&apos;expertise de l&apos;avocat. MemoLib ne saurait etre tenu responsable des consequences d&apos;une decision prise sur la base des informations fournies par la Plateforme, notamment les calculs de delais et suggestions IA. La responsabilite de MemoLib est limitee au montant des sommes versees par l&apos;Utilisateur au cours des 12 derniers mois.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 13 - Propriete intellectuelle</h2>
              <p>La Plateforme, son code, son design et ses fonctionnalites sont la propriete exclusive de MD Conseils SAS. L&apos;Utilisateur beneficie d&apos;un droit d&apos;usage non exclusif, non cessible, limite a la duree de son abonnement.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 14 - Droit applicable et litiges</h2>
              <p>Les presentes CGU/CGV sont soumises au droit francais. En cas de litige, les parties s&apos;engagent a rechercher une solution amiable. A defaut, le Tribunal de Commerce de Metz sera seul competent.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">Article 15 - Contact</h2>
              <p>MD Conseils SAS<br/>86 Rue aux Arenes, 57000 Metz<br/>Email : sarraboudjellal57@gmail.com<br/>Tel : +33 6 03 98 37 09</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
            <Link href="/fr/privacy" className="hover:text-blue-600">Confidentialite</Link>
            <Link href="/fr/charte-ia" className="hover:text-blue-600">Charte IA</Link>
            <Link href="/fr/legal/cgu" className="hover:text-blue-600 font-medium">CGU/CGV</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
