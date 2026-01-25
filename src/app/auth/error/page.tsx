'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// Documentation des codes d'erreur NextAuth
const errorMessages: { [key: string]: string } = {
  Configuration: 'Erreur de configuration du serveur. Contactez l\'administrateur.',
  AccessDenied: 'Acces refuse. Vous n\'avez pas les permissions necessaires.',
  Verification: 'Le lien de verification est expire ou invalide.',
  OAuthSignin: 'Erreur lors de la connexion OAuth.',
  OAuthCallback: 'Erreur lors du callback OAuth.',
  OAuthCreateAccount: 'Impossible de creer le compte OAuth.',
  EmailCreateAccount: 'Impossible de creer le compte par email.',
  Callback: 'Erreur lors du callback d\'authentification.',
  OAuthAccountNotLinked: 'Ce compte email existe deja avec un autre fournisseur.',
  EmailSignin: 'Erreur lors de l\'envoi de l\'email de connexion.',
  CredentialsSignin: 'Email ou mot de passe incorrect.',
  SessionRequired: 'Vous devez etre connecte pour acceder a cette page.',
  Default: 'Une erreur est survenue lors de l\'authentification.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  // Handle undefined/null error codes
  const errorCode = error || 'Default';
  const errorMessage = errorMessages[errorCode] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* Icone d'erreur */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur d'authentification
          </h1>

          {/* Message d'erreur */}
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>

          {/* Code d'erreur technique (si present et pas Default) */}
          {error && errorCode !== 'Default' && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs font-mono text-gray-500">
                Code: <span className="text-red-600">{errorCode}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Retour a la connexion
            </Link>
            
            <Link
              href="/"
              className="block w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Retour a l'accueil
            </Link>
          </div>

          {/* Aide supplementaire */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Probleme persistant ?{' '}
              <a
                href="mailto:support@iapostemanager.fr"
                className="text-blue-600 hover:underline font-medium"
              >
                Contactez le support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
