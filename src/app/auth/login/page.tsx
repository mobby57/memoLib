'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState<string>('');

  useEffect(() => {
    // Vérifier si la session a expiré via les paramètres URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('timeout') === 'true') {
      setTimeoutMessage('⏱️ Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter.');
    } else if (params.get('error')) {
      setError('Une erreur est survenue lors de la connexion');
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      logger.error('Erreur connexion utilisateur', { error, email });
      setError('Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-6xl">⚖️</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">IA Poste Manager</h1>
          <p className="text-blue-200 text-lg">Système Multi-Tenant pour Cabinets d'Avocats</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connexion</h2>

          {timeoutMessage && (
            <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 px-4 py-3 rounded-r">
              <p className="font-semibold">⏱️ Session expirée</p>
              <p className="text-sm">{timeoutMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r">
              <p className="font-semibold">❌ Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="superadmin@iapostemanager.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                🔐 Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? '⏳ Connexion...' : '🚀 Se connecter'}
            </button>
          </form>

          {/* Comptes de démonstration */}
          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Comptes de démonstration:</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border-2 border-blue-200">
                <p className="font-bold text-blue-900">👤 Admin:</p>
                <p className="text-blue-700 mt-1 font-mono">admin@demo.com | demo123</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border-2 border-purple-200">
                <p className="font-bold text-purple-900">⚖️ Avocat:</p>
                <p className="text-purple-700 mt-1 font-mono">avocat@demo.com | demo123</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border-2 border-green-200">
                <p className="font-bold text-green-900">🏢 Cabinet Rousseau:</p>
                <p className="text-green-700 mt-1 font-mono">admin@rousseau.fr | rousseau2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-blue-200 text-sm">
          <p>🔒 Connexion sécurisée | Données chiffrées</p>
        </div>
      </div>
    </div>
  );
}
