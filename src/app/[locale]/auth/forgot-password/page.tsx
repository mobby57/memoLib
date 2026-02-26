'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page de demande de reinitialisation de mot de passe
 * L'utilisateur saisit son email et recoit un lien de reinitialisation
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        // Ne pas reveler si l'email existe ou non (securite)
        setSuccess(true);
      }
    } catch (err) {
      // Meme en cas d'erreur, afficher le succes pour la securite
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            {/* Icone succes */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-2xl font-bold text-white text-center mb-4">
              Email envoye !
            </h1>

            {/* Message */}
            <p className="text-gray-300 text-center mb-6">
              Si un compte existe avec l'adresse <span className="font-semibold text-blue-300">{email}</span>, 
              vous recevrez un email avec les instructions pour reinitialiser votre mot de passe.
            </p>

            {/* Note */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-200 text-center">
                N'oubliez pas de verifier votre dossier spam si vous ne recevez pas l'email dans les prochaines minutes.
              </p>
            </div>

            {/* Retour connexion */}
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour a la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Retour */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour a la connexion
        </Link>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Mot de passe oublie ?
            </h1>
            <p className="text-gray-400">
              Pas de panique ! Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer le lien
                </>
              )}
            </button>
          </form>

          {/* Aide */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Vous n'avez pas de compte ?{' '}
              <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Creer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
