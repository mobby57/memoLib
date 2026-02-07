'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Conditions Générales d'Utilisation (CGU)</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none text-gray-700">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Définitions</h2>
              <div className="space-y-2">
                <p><strong>Service :</strong> La plateforme MemoLib accessible via memolib.fly.dev</p>
                <p><strong>Utilisateur :</strong> Toute personne inscrite et utilisant le Service</p>
                <p><strong>Contenu :</strong> Dossiers, clients, documents créés par l'Utilisateur</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptation des CGU</h2>
              <p>
                En utilisant MemoLib, vous acceptez l'intégralité de ces CGU. Si vous n'acceptez pas
                ces conditions, veuillez ne pas utiliser le Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Licence d'Utilisation</h2>
              <p>
                MemoLib vous octroie une licence non-exclusive, non-transférable et révocable
                d'accès et d'utilisation du Service selon votre plan d'abonnement.
              </p>
              <p className="mt-2">
                Vous ne pouvez pas :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reproduire, dupliquer ou copier le code source</li>
                <li>Revendre ou affermer l'accès au Service</li>
                <li>Utiliser le Service pour des activités illégales</li>
                <li>Contourner la sécurité ou les limitations du Service</li>
                <li>Dépasser les limites de votre plan (clients, dossiers, stockage)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Plans d'Abonnement</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Plan Gratuit</h3>
                  <p>5 clients, 10 dossiers, 1 Go de stockage</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Plan Pro (29€/mois)</h3>
                  <p>50 clients, 500 dossiers, 50 Go, Analyse IA, Rapports avancés</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Plan Enterprise (99€/mois)</h3>
                  <p>Clients illimités, Dossiers illimités, 500 Go, Accès API, Support 24/7</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Facturation et Paiement</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les paiements sont traités par Stripe de manière sécurisée</li>
                <li>Les abonnements se renouvellent automatiquement</li>
                <li>Vous pouvez annuler votre abonnement à tout moment</li>
                <li>Essai gratuit de 14 jours pour les nouveaux utilisateurs (plans payants)</li>
                <li>Pas de remboursement pour les périodes partielles</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriété du Contenu</h2>
              <p>
                Vous conservez la propriété intégrale de votre Contenu. En utilisant le Service,
                vous nous accordez une licence pour stocker, héberger et traiter votre Contenu selon votre instruction.
              </p>
              <p className="mt-2">
                Nous ne partageons jamais votre Contenu avec des tiers sans votre consentement explicite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Responsabilité</h2>
              <p className="font-semibold">
                🔴 Limitation de responsabilité importante :
              </p>
              <p>
                MemoLib est un outil d'assistance. Vous restez entièrement responsable de la qualité
                juridique de votre travail. Any output est destiné à vous assister, pas à remplacer
                votre jugement professionnel.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Suspension et Résiliation</h2>
              <p>
                Nous nous réservons le droit de suspendre ou résilier votre accès au Service si vous :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violez ces CGU</li>
                <li>Utilisez le Service de manière abusive ou nuisible</li>
                <li>Ne payez pas les frais dus</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications du Service</h2>
              <p>
                MemoLib se réserve le droit de modifier, suspendre ou discontinuer le Service à tout
                moment, avec ou sans préavis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Droit Applicable</h2>
              <p>
                Ces CGU sont régies par la loi française et soumises à la juridiction exclusive des
                tribunaux français.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
              <p>Pour toute question : <span className="font-mono">contact@memolib.fr</span></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
