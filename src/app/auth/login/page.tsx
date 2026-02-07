'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { logger } from '@/lib/logger';
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, Mail, Shield, Users, Zap } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState<string>('');

  useEffect(() => {
    // Verifier si la session a expire via les parametres URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('timeout') === 'true') {
      setTimeoutMessage(
        '? Votre session a expire pour des raisons de securite. Veuillez vous reconnecter.'
      );
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
      } else if (result?.ok) {
        // Redirection basée sur l'email (déterminé côté serveur)
        if (email === 'admin@memolib.fr') {
          router.push('/super-admin/dashboard');
        } else if (email === 'client@memolib.fr') {
          router.push('/client-dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      logger.error('Erreur connexion utilisateur', { error, email });
      setError('Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white mb-8 hover:opacity-80 transition-opacity"
          >
            <span className="text-4xl">??</span>
            <span className="text-2xl font-bold">memoLib</span>
          </Link>

          <h2 className="text-4xl font-bold text-white mb-6">
            Gérez votre cabinet avec intelligence
          </h2>

          <p className="text-blue-200 text-lg mb-12">
            La solution complète pour les avocats modernes : dossiers, clients, factures et IA
            intégrée.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Sécurité maximale</h3>
                <p className="text-blue-200 text-sm">
                  Chiffrement AES-256 et conformité RGPD garantie
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">IA intégrée</h3>
                <p className="text-blue-200 text-sm">
                  Analyse automatique des documents et suggestions intelligentes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Multi-cabinet</h3>
                <p className="text-blue-200 text-sm">
                  Gérez plusieurs cabinets avec un seul compte
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-md w-full">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <span className="text-6xl">??</span>
            <h1 className="text-3xl font-bold text-white mt-4">memoLib</h1>
          </div>

          {/* Form card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-500 mb-6">Accédez à votre espace de gestion</p>

            {timeoutMessage && (
              <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 px-4 py-3 rounded-r">
                <p className="font-semibold">?? Session expirée</p>
                <p className="text-sm">{timeoutMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r">
                <p className="font-semibold">? Erreur</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* OAuth providers */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Ou continuer avec</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">GitHub</span>
                </button>
              </div>
            </div>

            {/* Demo accounts */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 flex items-center gap-2 hover:text-blue-600">
                <span>??</span>
                <span>Comptes de démonstration</span>
              </summary>
              <div className="mt-3 space-y-2 text-xs">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                  <p className="font-bold text-purple-900">?? Super Admin</p>
                  <p className="text-purple-700 mt-1 font-mono text-xs">
                    superadmin@memoLib.com | SuperAdmin2026!
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-bold text-blue-900">?? Avocat</p>
                  <p className="text-blue-700 mt-1 font-mono text-xs">
                    avocat@cabinet-dupont.fr | Avocat2026!
                  </p>
                </div>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-blue-200 text-sm">
              Pas encore de compte ?{' '}
              <Link href="/auth/register" className="font-semibold text-white hover:underline">
                Créer un compte
              </Link>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-blue-300/70">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Sécurisé
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Chiffré
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> RGPD
              </span>
            </div>
            <Link
              href="/"
              className="inline-block text-blue-200 hover:text-white text-sm hover:underline"
            >
              ? Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
