'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

/**
 * Page Paramètres > Emails
 * Permet à l'avocat de connecter sa boîte Gmail/Outlook en 1 clic
 */
export default function SettingsEmailsPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const connectedEmail = searchParams.get('email');
  const [loading, setLoading] = useState(false);

  const handleConnectGmail = () => {
    setLoading(true);
    window.location.href = '/api/email/connect/gmail';
  };

  const handleConnectOutlook = () => {
    setLoading(true);
    window.location.href = '/api/email/connect/outlook';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connexion Email</h1>
        <p className="mt-2 text-gray-600">
          Connectez votre boîte email pour recevoir et analyser automatiquement vos messages.
        </p>
      </div>

      {/* Messages de succès/erreur */}
      {success === 'gmail_connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <div>
            <p className="font-medium text-green-800">Gmail connecté avec succès !</p>
            <p className="text-sm text-green-700 mt-1">
              Les emails de <strong>{connectedEmail}</strong> seront analysés automatiquement.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-red-600 text-xl">❌</span>
          <div>
            <p className="font-medium text-red-800">Erreur de connexion</p>
            <p className="text-sm text-red-700 mt-1">
              {error === 'consent_denied' && "Vous avez refusé l'accès. Réessayez quand vous êtes prêt."}
              {error === 'token_exchange_failed' && "Erreur technique. Veuillez réessayer."}
              {error === 'server_error' && "Erreur serveur. Contactez le support."}
              {error === 'invalid_callback' && "Lien invalide. Veuillez recommencer."}
            </p>
          </div>
        </div>
      )}

      {/* Sécurité */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 flex items-center gap-2">
          🔒 Sécurité garantie
        </h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• <strong>Lecture seule</strong> — MemoLib ne peut ni envoyer, ni supprimer vos emails</li>
          <li>• <strong>Chiffrement</strong> — Vos accès sont chiffrés (AES-256)</li>
          <li>• <strong>Révocable</strong> — Retirez l'accès à tout moment depuis votre compte Google</li>
          <li>• <strong>RGPD</strong> — Vos données restent dans votre espace, jamais partagées</li>
        </ul>
      </div>

      {/* Boutons de connexion */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Connecter une boîte email</h2>

        <button
          onClick={handleConnectGmail}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium text-gray-700">
            {loading ? 'Redirection vers Google...' : 'Connecter Gmail'}
          </span>
        </button>

        <button
          onClick={handleConnectOutlook}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.152-.357.228-.594.228h-8.37v-6.078l1.674 1.2c.08.054.17.08.272.08.1 0 .19-.026.27-.08L24 9.098V7.387zM23.168 6H14.8l3.528 2.572c.08.054.17.08.27.08.1 0 .19-.026.272-.08L23.168 6z"/>
            <path fill="#0078D4" d="M13.2 6v12.67H2.398c-.237 0-.434-.076-.594-.228C1.644 18.29 1.564 18.096 1.564 17.864V6.136c0-.23.08-.424.24-.576.16-.152.357-.228.594-.228H13.2z"/>
            <path fill="#fff" opacity=".5" d="M8.2 9.6c-.9 0-1.63.296-2.19.888-.56.592-.84 1.36-.84 2.304 0 .924.28 1.682.84 2.274.56.592 1.29.888 2.19.888.9 0 1.63-.296 2.19-.888.56-.592.84-1.35.84-2.274 0-.944-.28-1.712-.84-2.304C9.83 9.896 9.1 9.6 8.2 9.6z"/>
          </svg>
          <span className="font-medium text-gray-700">
            {loading ? 'Redirection...' : 'Connecter Outlook'}
          </span>
        </button>
      </div>

      {/* Comment révoquer */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Révoquer l'accès</h3>
        <p className="mt-2 text-sm text-gray-600">
          Pour retirer l'accès de MemoLib à vos emails, rendez-vous sur{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            vos autorisations Google
          </a>{' '}
          et supprimez MemoLib.
        </p>
      </div>
    </div>
  );
}
