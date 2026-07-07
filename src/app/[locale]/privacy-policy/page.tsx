import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - MemoLib',
  description: 'Comment MemoLib protège vos données personnelles et celles de vos clients.',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
          <p className="text-gray-500 mb-8">Dernière mise à jour : juillet 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">

            <section>
              <h2 className="text-xl font-bold text-gray-900">1. Responsable de traitement</h2>
              <p>MD Conseils SAS, 86 Rue aux Arènes, 57000 Metz, France.</p>
              <p>Contact DPO : sarraboudjellal57@gmail.com</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">2. Données collectées</h2>
              <h3 className="text-lg font-semibold text-gray-800 mt-4">Données d&apos;inscription</h3>
              <p>Nom, prénom, email, téléphone, nom du cabinet, numéro de barreau.</p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4">Données de dossiers clients</h3>
              <p>Identité du client (nom, prénom, nationalité, date de naissance), type de procédure, documents joints, historique des échanges.</p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4">Données sensibles (Art. 9 RGPD)</h3>
              <p>Origine ethnique, opinions politiques (asile), données de santé, données judiciaires — <strong>uniquement avec consentement explicite et granulaire</strong> du client, recueilli avant tout traitement.</p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4">Données techniques</h3>
              <p>Adresse IP, User-Agent, logs de connexion (audit trail), métriques d&apos;utilisation anonymisées.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">3. Finalités du traitement</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestion des dossiers juridiques et suivi de procédures</li>
                <li>Communication avocat-client</li>
                <li>Génération de documents juridiques</li>
                <li>Aide à la décision par intelligence artificielle (suggestions non contraignantes)</li>
                <li>Facturation et gestion des abonnements</li>
                <li>Sécurité et prévention des fraudes</li>
                <li>Conformité aux obligations légales (conservation des dossiers)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">4. Bases légales</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contrat</strong> (Art. 6(1)(b)) : exécution du service d&apos;abonnement</li>
                <li><strong>Obligation légale</strong> (Art. 6(1)(c)) : conservation des dossiers (5 ans), obligations fiscales (10 ans)</li>
                <li><strong>Intérêt légitime</strong> (Art. 6(1)(f)) : sécurité, amélioration du service</li>
                <li><strong>Consentement explicite</strong> (Art. 9(2)(a)) : données sensibles des clients</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">5. Intelligence artificielle</h2>
              <p>MemoLib utilise des modèles d&apos;IA pour proposer des résumés, classifications et suggestions. <strong>Aucune décision automatisée</strong> n&apos;est prise sans validation humaine.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Les données sont <strong>anonymisées automatiquement</strong> avant tout traitement IA (suppression des noms, emails, téléphones, adresses)</li>
                <li>Le modèle principal (Ollama) fonctionne <strong>localement</strong> — aucune donnée ne quitte le réseau</li>
                <li>En cas de fallback vers un modèle cloud, seules des données anonymisées sont transmises</li>
                <li>Les résultats IA ne constituent pas un conseil juridique</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">6. Sous-traitants</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Sous-traitant</th>
                    <th className="text-left py-2 pr-4">Service</th>
                    <th className="text-left py-2">Localisation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-2 pr-4">Neon</td><td className="pr-4">Base de données</td><td>UE (Frankfurt)</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4">Vercel</td><td className="pr-4">Hébergement</td><td>UE (Paris)</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4">Upstash</td><td className="pr-4">Cache</td><td>UE (Frankfurt)</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4">Stripe</td><td className="pr-4">Paiements</td><td>UE (DPA signé)</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4">Sentry</td><td className="pr-4">Monitoring</td><td>UE (Frankfurt)</td></tr>
                  <tr><td className="py-2 pr-4">Cloudflare</td><td className="pr-4">CDN/WAF</td><td>Global (transit)</td></tr>
                </tbody>
              </table>
              <p className="mt-2 text-sm text-gray-600">Tous les sous-traitants ont signé un DPA conforme à l&apos;Art. 28 RGPD. Aucun transfert de données personnelles hors UE.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">7. Durées de conservation</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Dossiers juridiques</strong> : 5 ans après clôture (obligation légale cabinets)</li>
                <li><strong>Pièces de contentieux</strong> : 10 ans</li>
                <li><strong>Documents fiscaux</strong> : 7 ans</li>
                <li><strong>Logs d&apos;audit</strong> : 2 ans</li>
                <li><strong>Données d&apos;analytique</strong> : 3 ans (anonymisées)</li>
                <li><strong>Compte supprimé</strong> : 30 jours de grâce, puis effacement (sauf obligations légales)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">8. Vos droits</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Accès</strong> (Art. 15) : obtenir une copie de vos données</li>
                <li><strong>Rectification</strong> (Art. 16) : corriger des données inexactes</li>
                <li><strong>Effacement</strong> (Art. 17) : suppression (sous réserve des obligations de conservation légale)</li>
                <li><strong>Portabilité</strong> (Art. 20) : export dans un format structuré</li>
                <li><strong>Opposition</strong> (Art. 21) : s&apos;opposer au traitement</li>
                <li><strong>Retrait du consentement</strong> (Art. 7(3)) : à tout moment, sans effet rétroactif</li>
              </ul>
              <p className="mt-2">Exercez vos droits via votre espace <Link href="/privacy" className="text-blue-600 hover:underline">Mes données personnelles</Link> ou par email au DPO.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">9. Sécurité</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Chiffrement TLS 1.3 en transit</li>
                <li>Chiffrement AES-256 au repos pour les données sensibles</li>
                <li>Isolation multi-tenant (chaque cabinet est cloisonné)</li>
                <li>Audit trail chaîné (hash chain SHA-256, intégrité vérifiable)</li>
                <li>Scan antivirus sur chaque upload (ClamAV)</li>
                <li>Authentification multi-facteur disponible</li>
                <li>Rotation trimestrielle des secrets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">10. Violation de données</h2>
              <p>En cas de violation de données à caractère personnel, MemoLib s&apos;engage à :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Notifier la CNIL dans les 72 heures (Art. 33)</li>
                <li>Informer les personnes concernées sans délai indu si risque élevé (Art. 34)</li>
                <li>Documenter l&apos;incident dans le registre des violations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">11. Réclamation</h2>
              <p>Vous pouvez introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr/fr/plaintes" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a></p>
            </section>

          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
            <Link href="/fr/legal/cgu" className="hover:text-blue-600">CGU/CGV</Link>
            <Link href="/fr/privacy" className="hover:text-blue-600">Mes données</Link>
            <span className="font-medium text-gray-700">Confidentialité</span>
          </div>
        </div>
      </div>
    </div>
  );
}
