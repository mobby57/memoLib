'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function MentionsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Mentions Légales</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none text-gray-700">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Éditeur du site</h2>
              <div className="space-y-2">
                <p><strong>Raison sociale :</strong> MemoLib SAS</p>
                <p><strong>Capital social :</strong> À définir</p>
                <p><strong>Siège social :</strong> France 🇫🇷</p>
                <p><strong>Email :</strong> contact@memolib.fr</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Directeur de Publication</h2>
              <p>Le directeur de la publication est : À définir</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Hébergeur</h2>
              <div className="space-y-2">
                <p><strong>Nom :</strong> Fly.io (Fly Stack, Inc.)</p>
                <p><strong>Siège :</strong> États-Unis</p>
                <p><strong>Serveurs :</strong> Paris, France (CDG)</p>
                <p><strong>Site :</strong> https://fly.io</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Infrastructure Technique</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Frontend</h3>
                  <p>Next.js 16.1.6 (with Turbopack), TypeScript, React 19</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Backend</h3>
                  <p>Python (FastAPI), Flask (développement local)</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Base de Données</h3>
                  <p>PostgreSQL 16 Alpine, Prisma ORM</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Authentification</h3>
                  <p>Azure AD via NextAuth.js</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Monitoring</h3>
                  <p>Sentry Release Health, Application Insights</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Externes</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Paiements :</strong> Stripe Inc. (https://stripe.com)</li>
                <li><strong>Email/SMS :</strong> Twilio Inc. (https://www.twilio.com)</li>
                <li><strong>IA/LLM :</strong> OpenAI / Meta Llama</li>
                <li><strong>Graph :</strong> Microsoft Graph API</li>
                <li><strong>Stockage :</strong> Azure Blob Storage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Propriété Intellectuelle</h2>
              <p>
                Tous les contenus du site (textes, images, logos, code) sont la propriété exclusive
                de MemoLib ou de ses contributeurs et sont protégés par les lois applicable sur la
                propriété intellectuelle.
              </p>
              <p className="mt-2">
                Toute reproduction ou utilisation sans autorisation écrite est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation de Responsabilité</h2>
              <p>
                MemoLib est fourni "tel quel". Nous déclinons toute garantie et ne sommes pas
                responsable des dommages directs ou indirects résultant de l'utilisation du Service.
              </p>
              <p className="mt-2">
                ⚠️ <strong>Important pour les avocats :</strong> Vous gardez l'entière responsabilité
                de la qualité juridique de votre travail. MemoLib est un outil d'assistance, pas un
                substitut à votre professionnel.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Données Personnelles</h2>
              <p>
                Pour plus d'informations sur le traitement de vos données à caractère personnel,
                veuillez consulter notre
              </p>
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                Politique de Confidentialité
              </a>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Signalement d'Abus</h2>
              <p>
                Si vous identifiez une utilisation abusive du Service, un contenu illégal ou une
                violation de propriété intellectuelle, veuillez nous contacter immédiatement.
              </p>
              <p className="mt-2">
                <strong>Email :</strong> <span className="font-mono">contact@memolib.fr</span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Modification des Mentions Légales</h2>
              <p>
                Nous nous réservons le droit de mettre à jour ces mentions légales à tout moment.
                Les modifications entrent en vigueur dès leur publication.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Droit Applicable</h2>
              <p>
                Ces mentions légales sont régies par la loi française et soumises à la juridiction
                exclusive des tribunaux français.
              </p>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Dernière mise à jour :</strong> 7 février 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
