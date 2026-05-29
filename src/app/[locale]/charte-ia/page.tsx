'use client';

import Link from 'next/link';
import { Shield, Brain, Eye, UserCheck, AlertTriangle, Lock } from 'lucide-react';

export default function CharteIAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Charte IA MemoLib</h1>
            <p className="text-lg text-gray-600">
              Notre engagement pour une intelligence artificielle responsable au service du droit
            </p>
            <p className="text-sm text-gray-400 mt-2">Derniere mise a jour : mai 2026</p>
          </div>

          <div className="space-y-10">
            {/* Principe 1 */}
            <section className="flex gap-4">
              <UserCheck className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. L&apos;humain reste decisionnaire</h2>
                <p className="text-gray-700 leading-relaxed">
                  L&apos;IA de MemoLib est un <strong>assistant</strong>, jamais un decisionnaire. Toute suggestion
                  (resume, classification, delai, brouillon de reponse) doit etre <strong>validee par l&apos;avocat</strong> avant
                  toute action. Aucune decision juridique n&apos;est prise automatiquement.
                </p>
              </div>
            </section>

            {/* Principe 2 */}
            <section className="flex gap-4">
              <Eye className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Transparence des traitements</h2>
                <ul className="text-gray-700 space-y-2 list-disc pl-5">
                  <li>Chaque suggestion IA est clairement identifiee comme telle</li>
                  <li>Le score de confiance est affiche quand disponible</li>
                  <li>Les sources (articles CESEDA, jurisprudence) sont citees</li>
                  <li>L&apos;IA ne fabrique pas de jurisprudence fictive</li>
                </ul>
              </div>
            </section>

            {/* Principe 3 */}
            <section className="flex gap-4">
              <Lock className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Protection des donnees</h2>
                <ul className="text-gray-700 space-y-2 list-disc pl-5">
                  <li>Les donnees des dossiers ne sont <strong>jamais utilisees pour entrainer</strong> nos modeles</li>
                  <li>Le traitement IA est effectue sur des serveurs europeens (UE)</li>
                  <li>Les donnees sont chiffrees en transit et au repos (AES-256)</li>
                  <li>Isolation stricte entre cabinets (multi-tenant)</li>
                  <li>Conformite RGPD : droit a l&apos;oubli, portabilite, audit trail</li>
                </ul>
              </div>
            </section>

            {/* Principe 4 */}
            <section className="flex gap-4">
              <Shield className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Secret professionnel</h2>
                <p className="text-gray-700 leading-relaxed">
                  Le secret professionnel de l&apos;avocat (art. 66-5 loi du 31 decembre 1971) est garanti par :
                </p>
                <ul className="text-gray-700 space-y-2 list-disc pl-5 mt-2">
                  <li>Aucun acces administrateur aux contenus des dossiers</li>
                  <li>Isolation complete des donnees entre cabinets</li>
                  <li>Pas de partage de donnees avec des tiers</li>
                  <li>Hebergement dedie, non mutualise avec d&apos;autres services</li>
                </ul>
              </div>
            </section>

            {/* Principe 5 */}
            <section className="flex gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Limites de l&apos;IA</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous reconnaissons que l&apos;IA a des limites :
                </p>
                <ul className="text-gray-700 space-y-2 list-disc pl-5 mt-2">
                  <li>Les suggestions peuvent etre incorrectes ou incompletes</li>
                  <li>L&apos;IA ne remplace pas l&apos;expertise juridique d&apos;un avocat</li>
                  <li>Les delais calcules sont indicatifs et doivent etre verifies</li>
                  <li>La classification automatique peut se tromper sur des cas atypiques</li>
                </ul>
                <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r">
                  <p className="text-amber-800 font-medium">
                    MemoLib est un outil d&apos;aide a la gestion. Il ne constitue en aucun cas un conseil juridique.
                  </p>
                </div>
              </div>
            </section>

            {/* Principe 6 */}
            <section className="flex gap-4">
              <Brain className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Amelioration continue</h2>
                <ul className="text-gray-700 space-y-2 list-disc pl-5">
                  <li>Les statistiques anonymisees (taux de succes par tribunal) respectent un minimum de 5 dossiers pour eviter la re-identification</li>
                  <li>Les templates communautaires sont moderes avant publication</li>
                  <li>Nous auditons regulierement les performances et biais de nos modeles</li>
                  <li>Cette charte est revisee au minimum une fois par an</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center space-y-4">
            <p className="text-gray-600">
              Questions sur notre utilisation de l&apos;IA ?{' '}
              <Link href="/contact" className="text-blue-600 hover:underline font-medium">Contactez-nous</Link>
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <Link href="/fr/legal/cgu" className="hover:text-blue-600">CGU</Link>
              <Link href="/fr/privacy" className="hover:text-blue-600">Confidentialite</Link>
              <Link href="/fr/legal/cgu" className="hover:text-blue-600">Mentions legales</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
