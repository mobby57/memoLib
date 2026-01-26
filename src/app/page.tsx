'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FileText, Users, DollarSign, Shield, Zap, TrendingUp, ChevronRight, CheckCircle, LogIn, UserPlus, Calendar, MessageSquare, CreditCard } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();

  // Afficher la landing page sans redirection automatique
  // L'utilisateur doit cliquer sur "Dashboard" ou "Connexion" pour naviguer

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              IA Poste Manager
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Tarifs
              </Link>
              <Link href="/demo" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Demo
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Contact
              </Link>
              {status === 'authenticated' ? (
                <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                IA Poste Manager
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              La plateforme intelligente de gestion pour cabinets d'avocats
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Gerez vos dossiers, clients et factures avec une solution moderne et securisee, 
              optimisee par l'intelligence artificielle
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <LogIn className="mr-2 w-5 h-5" />
                    Acceder au Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <LogIn className="mr-2 w-5 h-5" />
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <UserPlus className="mr-2 w-5 h-5" />
                    Creer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fonctionnalites principales
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tout ce dont vous avez besoin pour gerer votre cabinet efficacement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestion des Dossiers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Organisez et suivez tous vos dossiers juridiques en un seul endroit avec une interface intuitive
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Facturation Automatisee
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Creez et gerez vos factures facilement avec calcul automatique de la TVA et suivi des paiements
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestion Clients
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Centralisez toutes les informations de vos clients, particuliers et entreprises
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics & Reporting
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visualisez vos performances avec des graphiques et statistiques detaillees
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Intelligence Artificielle
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Beneficiez de suggestions et d'automatisations intelligentes pour gagner du temps
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Securite & Conformite
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vos donnees sont protegees avec un chiffrement de niveau entreprise et conformite RGPD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Pourquoi choisir IA Poste Manager ?
              </h2>
              <div className="space-y-4">
                {[
                  'Interface moderne et intuitive',
                  'Mode sombre pour un confort optimal',
                  'Recherche et filtres avances',
                  'Notifications en temps reel',
                  'Export de donnees (CSV, PDF)',
                  'Support multi-tenant',
                  'Mises a jour regulieres'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Demarrez des aujourd'hui
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Rejoignez les cabinets d'avocats qui font confiance a IA Poste Manager 
                pour optimiser leur gestion quotidienne.
              </p>
              <Link
                href="/auth/login"
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">IA Poste Manager</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                La solution intelligente pour les cabinets d'avocats modernes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Tarifs</Link></li>
                <li><Link href="/demo" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Demander une demo</Link></li>
                <li><Link href="/auth/register" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">S'inscrire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Contact</Link></li>
                <li><Link href="/contact?type=support" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">CGU</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Confidentialite</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">RGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-center text-gray-600 dark:text-gray-400">
               2026 IA Poste Manager. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
