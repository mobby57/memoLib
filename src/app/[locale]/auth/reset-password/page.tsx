'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page de reinitialisation de mot de passe
 * L'utilisateur arrive ici via le lien envoye par email
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Shield, Check, X } from 'lucide-react';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

function checkPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = 'Tres faible';
  let color = 'bg-red-500';

  if (score >= 5) {
    label = 'Excellent';
    color = 'bg-green-500';
  } else if (score >= 4) {
    label = 'Fort';
    color = 'bg-blue-500';
  } else if (score >= 3) {
    label = 'Moyen';
    color = 'bg-yellow-500';
  } else if (score >= 2) {
    label = 'Faible';
    color = 'bg-orange-500';
  }

  return { score, label, color, requirements };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const passwordStrength = checkPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Verifier la validite du token
  useEffect(() => {
    if (!token || !email) {
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        });

        setTokenValid(response.ok);
      } catch (err) {
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token, email]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validations
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Le mot de passe n\'est pas assez fort');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de la reinitialisation');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Token invalide ou manquant
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Lien invalide ou expire
            </h1>
            <p className="text-gray-300 mb-6">
              Ce lien de reinitialisation n'est plus valide. Il a peut-etre expire ou a deja ete utilise.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Verification en cours
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Verification du lien...</p>
        </div>
      </div>
    );
  }

  // Succes
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Mot de passe modifie !
            </h1>
            <p className="text-gray-300 mb-6">
              Votre mot de passe a ete reinitialise avec succes. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Se connecter
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-400">
              Choisissez un mot de passe fort et securise pour votre compte.
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
            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Indicateur de force */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{passwordStrength.label}</span>
                  </div>
                  
                  {/* Requirements */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center gap-1 ${passwordStrength.requirements.length ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordStrength.requirements.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      8 caracteres min.
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.requirements.uppercase ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordStrength.requirements.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Majuscule
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.requirements.lowercase ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordStrength.requirements.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Minuscule
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.requirements.number ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordStrength.requirements.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Chiffre
                    </div>
                    <div className={`flex items-center gap-1 ${passwordStrength.requirements.special ? 'text-green-400' : 'text-gray-500'}`}>
                      {passwordStrength.requirements.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Caractere special
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Indicateur de correspondance */}
              {confirmPassword && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordsMatch || passwordStrength.score < 3}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Modification en cours...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Modifier le mot de passe
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
