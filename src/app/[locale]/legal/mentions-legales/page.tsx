import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentions Légales - MemoLib',
  description: 'Mentions légales de la plateforme MemoLib',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions Légales</h1>
          <p className="text-gray-500 mb-8">Conformément à l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900">1. Éditeur du site</h2>
              <p><strong>MemoLib</strong> est édité par :</p>
              <ul className="list-none space-y-1">
                <li><strong>Raison sociale :</strong> MD Conseils SAS</li>
                <li><strong>Forme juridique :</strong> Société par Actions Simplifiée</li>
                <li><strong>Siège social :</strong> 86 Rue aux Arènes, 57000 Metz, France</li>
                <li><strong>SIRET :</strong> En cours d&apos;immatriculation</li>
                <li><strong>Directeur de la publication :</strong> Morosi DIBE</li>
                <li><strong>Contact :</strong> contact@memolib.space</li>
                <li><strong>Téléphone :</strong> +33 (0)6 XX XX XX XX</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">2. Hébergement</h2>
              <ul className="list-none space-y-1">
                <li><strong>Application :</strong> Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
                <li><strong>Base de données :</strong> Neon (PostgreSQL serverless) — Hébergement EU (Frankfurt)</li>
                <li><strong>Domaine :</strong> memolib.space</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                Les données sont stockées dans l&apos;Union Européenne conformément au RGPD.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">3. Propriété intellectuelle</h2>
              <p>
                L&apos;ensemble du contenu du site MemoLib (textes, images, logiciels, code source, bases de données, graphismes, logos) 
                est la propriété exclusive de MD Conseils SAS ou de ses partenaires et est protégé par les lois françaises et 
                internationales relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification ou adaptation totale ou partielle du site ou de son contenu, 
                par quelque procédé que ce soit, sans l&apos;autorisation expresse de MD Conseils SAS, est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">4. Protection des données personnelles</h2>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) et à la loi 
                Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Droit d&apos;accès à vos données personnelles</li>
                <li>Droit de rectification</li>
                <li>Droit à l&apos;effacement (droit à l&apos;oubli)</li>
                <li>Droit à la portabilité des données</li>
                <li>Droit d&apos;opposition au traitement</li>
                <li>Droit à la limitation du traitement</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : <strong>rgpd@memolib.space</strong>
              </p>
              <p>
                Délégué à la Protection des Données (DPO) : Morosi DIBE — dpo@memolib.space
              </p>
              <p className="text-sm text-gray-600">
                Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">5. Cookies</h2>
              <p>
                MemoLib utilise des cookies strictement nécessaires au fonctionnement du service (authentification, session). 
                Aucun cookie de tracking publicitaire n&apos;est utilisé. Les cookies analytiques (si activés) respectent 
                l&apos;exemption CNIL pour la mesure d&apos;audience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">6. Responsabilité</h2>
              <p>
                MemoLib est un outil d&apos;assistance à la gestion de cabinet. Il ne se substitue en aucun cas au conseil 
                juridique d&apos;un avocat. Les analyses et suggestions générées par l&apos;intelligence artificielle sont 
                indicatives et doivent être validées par un professionnel du droit avant toute action.
              </p>
              <p>
                MD Conseils SAS ne saurait être tenue responsable des décisions prises sur la base des informations 
                fournies par la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">7. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux 
                de Metz seront seuls compétents.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4 text-sm text-gray-500">
            <Link href="/legal/cgu" className="text-blue-600 hover:underline">CGU/CGV</Link>
            <Link href="/legal/confidentialite" className="text-blue-600 hover:underline">Politique de confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
