'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Politique de Confidentialité</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none text-gray-700">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                MemoLib ("nous", "notre" ou "nos") exploite le site web memolib.fly.dev (le "Service").
              </p>
              <p>
                Cette page vous informe de nos politiques concernant la collecte, l'utilisation et la
                divulgation de données personnelles lorsque vous utilisez notre Service et des choix
                que vous avez associés à ces données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données Collectées</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Données d'authentification</h3>
                  <p>
                    Nous collectons votre email, nom et prénom pour créer votre compte MemoLib avec
                    authentification Azure AD.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Données de contenu</h3>
                  <p>
                    Les dossiers CESEDA, clients et documents que vous créez sont stockés de manière
                    sécurisée dans notre base de données PostgreSQL en France.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Données d'utilisation</h3>
                  <p>
                    Nous collectons les logs d'accès, erreurs et événements pour améliorer notre Service
                    via Sentry Release Health.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Hébergement et Sécurité</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tous les serveurs sont hébergés en France (Fly.io CDG)</li>
                <li>Chiffrement HTTPS/TLS pour toutes les transmissions</li>
                <li>Base de données PostgreSQL 16 avec backups automatiques</li>
                <li>Authentification Azure AD (SSO)</li>
                <li>Contrôle d'accès basé sur les abonnements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Utilisation des Données</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fournir et maintenir le Service</li>
                <li>Notifier des modifications ou mises à jour</li>
                <li>Permettre votre participation aux fonctionnalités interactives</li>
                <li>Fournir un support client</li>
                <li>Collecter des données d'analyse pour améliorer le service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Conformité RGPD</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>✅ Droit d'accès à vos données</li>
                <li>✅ Droit de rectification</li>
                <li>✅ Droit à l'oubli (suppression)</li>
                <li>✅ Droit de portabilité</li>
                <li>✅ Droit à la limitation du traitement</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à: <span className="font-mono">contact@memolib.fr</span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
              <p>
                Nous utilisons des cookies pour maintenir votre session et améliorer votre expérience.
                Vous pouvez les contrôler via les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications</h2>
              <p>
                Nous pouvons mettre à jour cette Politique de Confidentialité à tout moment. Les
                modifications entrent en vigueur dès leur publication sur le Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
              <p>Si vous avez des questions, contactez-nous à : <span className="font-mono">contact@memolib.fr</span></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
