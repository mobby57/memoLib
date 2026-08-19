import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - MemoLib',
  description: 'Politique de confidentialité et protection des données personnelles de MemoLib',
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
          <p className="text-gray-500 mb-8">Dernière mise à jour : août 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données personnelles est MD Conseils SAS, 
                86 Rue aux Arènes, 57000 Metz, France.
              </p>
              <p>Contact DPO : <strong>dpo@memolib.space</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">2. Données collectées</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4">2.1 Données des utilisateurs (avocats)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nom, prénom, email professionnel</li>
                <li>Numéro SIRET du cabinet</li>
                <li>Données de connexion (logs, IP)</li>
                <li>Préférences d&apos;utilisation</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">2.2 Données des clients des avocats</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Identité (nom, prénom, date de naissance, nationalité)</li>
                <li>Coordonnées (adresse, téléphone, email)</li>
                <li>Documents administratifs (copies titres de séjour, passeports)</li>
                <li>Données relatives aux procédures (OQTF, demandes de titre, etc.)</li>
              </ul>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-800 font-medium">⚠️ Données sensibles</p>
                <p className="text-amber-700 text-sm mt-1">
                  Les données relatives aux procédures d&apos;immigration sont des données sensibles au sens du RGPD (Art. 9). 
                  Leur traitement est justifié par la nécessité de la constatation, l&apos;exercice ou la défense de droits en justice 
                  (Art. 9.2.f RGPD) dans le cadre de la relation avocat-client.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">3. Finalités du traitement</h2>
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">Finalité</th>
                    <th className="border border-gray-200 p-3 text-left">Base légale</th>
                    <th className="border border-gray-200 p-3 text-left">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3">Gestion des dossiers juridiques</td>
                    <td className="border border-gray-200 p-3">Exécution du contrat (Art. 6.1.b)</td>
                    <td className="border border-gray-200 p-3">5 ans après clôture</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Analyse IA des emails/documents</td>
                    <td className="border border-gray-200 p-3">Intérêt légitime (Art. 6.1.f)</td>
                    <td className="border border-gray-200 p-3">Durée du dossier</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Facturation</td>
                    <td className="border border-gray-200 p-3">Obligation légale (Art. 6.1.c)</td>
                    <td className="border border-gray-200 p-3">10 ans</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Sécurité et audit</td>
                    <td className="border border-gray-200 p-3">Intérêt légitime (Art. 6.1.f)</td>
                    <td className="border border-gray-200 p-3">2 ans</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Amélioration du service (analytics)</td>
                    <td className="border border-gray-200 p-3">Consentement (Art. 6.1.a)</td>
                    <td className="border border-gray-200 p-3">13 mois</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">4. Intelligence Artificielle</h2>
              <p>MemoLib utilise l&apos;IA pour :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Résumer les emails entrants (détection urgence, type de procédure)</li>
                <li>Extraire les délais légaux des documents</li>
                <li>Générer des brouillons de courriers (validation humaine obligatoire)</li>
                <li>Classifier les documents reçus</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 font-medium">🤖 Garanties IA</p>
                <ul className="text-blue-700 text-sm mt-1 space-y-1">
                  <li>• Les données sont <strong>anonymisées</strong> avant traitement IA</li>
                  <li>• L&apos;IA <strong>ne prend aucune décision</strong> — elle assiste l&apos;avocat</li>
                  <li>• Le traitement est effectué <strong>en local</strong> (Ollama) quand possible</li>
                  <li>• Aucune donnée n&apos;est utilisée pour entraîner des modèles tiers</li>
                  <li>• Un <strong>audit trail complet</strong> trace chaque action IA</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">5. Destinataires des données</h2>
              <p>Les données sont accessibles uniquement :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Aux membres autorisés du cabinet (selon les rôles RBAC)</li>
                <li>À l&apos;équipe technique MemoLib (maintenance, sous NDA)</li>
              </ul>
              <p className="mt-2">
                <strong>Aucune donnée n&apos;est vendue, louée ou partagée avec des tiers.</strong>
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">Sous-traitants</h3>
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">Prestataire</th>
                    <th className="border border-gray-200 p-3 text-left">Rôle</th>
                    <th className="border border-gray-200 p-3 text-left">Localisation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3">Neon (PostgreSQL)</td>
                    <td className="border border-gray-200 p-3">Base de données</td>
                    <td className="border border-gray-200 p-3">UE (Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Vercel</td>
                    <td className="border border-gray-200 p-3">Hébergement application</td>
                    <td className="border border-gray-200 p-3">UE (CDN edge)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Stripe</td>
                    <td className="border border-gray-200 p-3">Paiements</td>
                    <td className="border border-gray-200 p-3">UE (Irlande)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Sentry</td>
                    <td className="border border-gray-200 p-3">Monitoring erreurs</td>
                    <td className="border border-gray-200 p-3">UE</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">6. Sécurité des données</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Chiffrement des données sensibles (AES-256-GCM)</li>
                <li>Chiffrement en transit (TLS 1.3)</li>
                <li>Authentification multi-facteurs (2FA) pour les administrateurs</li>
                <li>Isolation multi-tenant (un cabinet ne voit jamais les données d&apos;un autre)</li>
                <li>Audit trail inaltérable (hash chain cryptographique)</li>
                <li>Scans de sécurité automatisés (SAST, dépendances, secrets)</li>
                <li>Rate limiting et protection anti-brute-force</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">7. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Rectification :</strong> corriger des données inexactes</li>
                <li><strong>Effacement :</strong> supprimer vos données (sous réserve des obligations légales de conservation)</li>
                <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré (JSON)</li>
                <li><strong>Opposition :</strong> vous opposer au traitement</li>
                <li><strong>Limitation :</strong> geler le traitement de vos données</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits : <strong>rgpd@memolib.space</strong><br />
                Délai de réponse : 30 jours maximum.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">8. Transferts hors UE</h2>
              <p>
                Les données sont hébergées dans l&apos;Union Européenne. En cas de transfert vers les États-Unis 
                (Vercel CDN), celui-ci est encadré par le EU-US Data Privacy Framework (décision d&apos;adéquation 
                de la Commission européenne du 10 juillet 2023).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">9. Réclamation</h2>
              <p>
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation 
                auprès de la CNIL :
              </p>
              <p className="mt-2">
                <strong>CNIL</strong> — 3 Place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07<br />
                <a href="https://www.cnil.fr/fr/plaintes" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">www.cnil.fr/fr/plaintes</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4 text-sm text-gray-500">
            <Link href="/legal/mentions-legales" className="text-blue-600 hover:underline">Mentions légales</Link>
            <Link href="/legal/cgu" className="text-blue-600 hover:underline">CGU/CGV</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
