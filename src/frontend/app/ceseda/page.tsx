import Link from 'next/link';
import { CheckCircle, Clock, FileText, Shield, TrendingUp, Users } from 'lucide-react';

export default function CesedaLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              MemoLib CESEDA
            </Link>
            <div className="flex gap-6 items-center">
              <Link href="#pillars" className="text-gray-600 hover:text-blue-600">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-blue-600">
                Tarifs
              </Link>
              <Link
                href="#demo"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Essai Gratuit 14 Jours
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
            🇫🇷 Première IA juridique CESEDA au monde
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            L'IA qui Respecte Votre Serment d'Avocat
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Gérez <span className="font-bold text-blue-600">3x plus de dossiers CESEDA</span> sans
            sacrifier la qualité juridique.
            <br />
            L'intelligence artificielle qui augmente votre expertise, pas qui la remplace.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="#demo"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 shadow-lg"
            >
              Démarrer Maintenant
            </Link>
            <Link
              href="#pillars"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50"
            >
              Découvrir Comment
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-blue-600">347</div>
              <div className="text-sm text-gray-600">Cabinets Utilisateurs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">87%</div>
              <div className="text-sm text-gray-600">Précision IA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">+47%</div>
              <div className="text-sm text-gray-600">Revenus Moyens</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section id="pillars" className="bg-gradient-to-b from-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              3 Piliers pour Transformer Votre Cabinet CESEDA
            </h2>
            <p className="text-xl text-gray-600">
              Une suite complète qui respecte l'éthique de votre profession
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pilier 1: IA Prédictive */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. IA Prédictive CESEDA</h3>
              <p className="text-gray-600 mb-6">
                Analysez vos chances de succès en 2 minutes au lieu de 3 heures de recherche
                manuelle.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>87% de précision</strong> sur 12,400 cas analysés
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Base de données jurisprudentielle <strong>mise à jour quotidiennement</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Analyse des <strong>5 dernières années</strong> de décisions CNDA
                  </span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Temps gagné par dossier</div>
                <div className="text-2xl font-bold text-blue-600">2h 48min</div>
              </div>
            </div>

            {/* Pilier 2: Alertes Délais */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                2. Alertes Délais Automatiques
              </h3>
              <p className="text-gray-600 mb-6">
                Zéro OQTF manquée. Système multi-canal qui surveille vos échéances 24/7.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>SMS + Email + WhatsApp</strong> à J-30, J-7, J-2
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Synchronisation <strong>automatique</strong> avec votre agenda
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Escalade vers <strong>assistant/e si non-lu sous 24h</strong>
                  </span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600">Délais manqués en 2024</div>
                <div className="text-2xl font-bold text-orange-600">0</div>
              </div>
            </div>

            {/* Pilier 3: Génération Documents */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Génération Documents IA</h3>
              <p className="text-gray-600 mb-6">
                Première ébauche en 30 secondes. Vous validez, modifiez, signez. Le contrôle reste à
                l'avocat.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Pre-draft instantané</strong> (recours OQTF, demandes asile)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Validation avocat obligatoire</strong> avant envoi
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    Modèles personnalisables <strong>selon votre style</strong>
                  </span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Temps de rédaction moyen</div>
                <div className="text-2xl font-bold text-purple-600">12 min</div>
                <div className="text-xs text-gray-500">vs 2h15 avant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Éthique & Confidentialité */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                <Shield className="inline w-4 h-4 mr-2" />
                Serment d'Avocat Respecté
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Votre Déontologie, Notre Priorité
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Données hébergées en France (OVH Strasbourg)
                    </div>
                    <div className="text-gray-600">
                      RGPD 100% conforme, certification HDS en cours
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Chiffrement de bout en bout (AES-256)
                    </div>
                    <div className="text-gray-600">Vos dossiers clients restent confidentiels</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Aucune revente de données à des tiers
                    </div>
                    <div className="text-gray-600">
                      Modèle économique 100% transparent (abonnement uniquement)
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      L'avocat garde le contrôle final
                    </div>
                    <div className="text-gray-600">L'IA suggère, vous décidez et validez</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl">
              <blockquote className="text-lg text-gray-700 italic mb-4">
                "Enfin une IA qui comprend que notre métier nécessite expertise ET éthique. MemoLib
                me fait gagner 15h/semaine sans jamais compromettre la qualité de mes conseils."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  MC
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Me Claire Martin</div>
                  <div className="text-sm text-gray-600">Avocate spécialisée CESEDA, Paris</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tarifs Transparents, ROI Garanti
            </h2>
            <p className="text-xl text-gray-600">
              Amortissez votre abonnement dès le premier dossier gagné
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Solo */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <div className="text-center mb-6">
                <div className="text-lg font-semibold text-gray-600 mb-2">Solo</div>
                <div className="text-5xl font-bold text-gray-900 mb-2">49€</div>
                <div className="text-gray-600">/mois</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">1 avocat</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">50 dossiers actifs max</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">IA Prédictive CESEDA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Alertes délais</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Support email</span>
                </li>
              </ul>
              <Link
                href="#demo"
                className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200"
              >
                Essai Gratuit 14 Jours
              </Link>
            </div>

            {/* Cabinet */}
            <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-blue-600 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Le Plus Populaire
              </div>
              <div className="text-center mb-6">
                <div className="text-lg font-semibold text-gray-600 mb-2">Cabinet</div>
                <div className="text-5xl font-bold text-gray-900 mb-2">149€</div>
                <div className="text-gray-600">/mois</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>3 avocats</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>200 dossiers actifs</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Toutes fonctionnalités Solo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Génération documents IA</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Support prioritaire</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Formation 2h incluse</span>
                </li>
              </ul>
              <Link
                href="#demo"
                className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Essai Gratuit 14 Jours
              </Link>
            </div>

            {/* Firm */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <div className="text-center mb-6">
                <div className="text-lg font-semibold text-gray-600 mb-2">Firm</div>
                <div className="text-5xl font-bold text-gray-900 mb-2">499€</div>
                <div className="text-gray-600">/mois</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>10+ avocats</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Dossiers illimités</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Toutes fonctionnalités Cabinet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>API personnalisée</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Account Manager dédié</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Formation équipe incluse</span>
                </li>
              </ul>
              <Link
                href="#demo"
                className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200"
              >
                Contactez-nous
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              💡 <strong>Association/ONG spécialisée?</strong> Tarif solidaire à 29€/mois disponible
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="demo" className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à Transformer Votre Pratique CESEDA?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez 347 cabinets qui ont déjà franchi le pas. Essai gratuit 14 jours, sans carte
            bancaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 shadow-xl"
            >
              Démarrer Gratuitement
            </Link>
            <Link
              href="/demo"
              className="bg-transparent text-white px-10 py-4 rounded-lg text-lg font-semibold border-2 border-white hover:bg-white/10"
            >
              Réserver une Démo
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            ✓ Installation en 5 minutes · ✓ Formation incluse · ✓ Support dédié
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-white font-bold text-xl mb-4">MemoLib CESEDA</div>
              <p className="text-sm">
                La première IA juridique qui respecte votre serment d'avocat.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#pillars" className="hover:text-white">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white">
                    Sécurité & RGPD
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-white">
                    Mises à jour
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog CESEDA
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-white">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/mentions" className="hover:text-white">
                    Mentions Légales
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 MemoLib. Tous droits réservés. Hébergé en France 🇫🇷</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
