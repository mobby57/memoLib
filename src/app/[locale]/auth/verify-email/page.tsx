'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

type Status = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params?.locale as string || 'fr';
  const token = searchParams?.get('token');

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'no-token');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const res = await fetch(`/${locale}/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erreur lors de la verification.');
        }
      } catch {
        setStatus('error');
        setMessage('Impossible de contacter le serveur. Reessayez plus tard.');
      }
    };

    verifyToken();
  }, [token, locale]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch(`/${locale}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      if (res.ok) {
        setResendSuccess(true);
      }
    } catch {
      // Silently fail (anti-enumeration)
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden">
        {/* Loading */}
        {status === 'loading' && (
          <div className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification en cours...</h2>
            <p className="text-gray-500">Veuillez patienter quelques instants.</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verifie !</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification echouee</h2>
            <p className="text-gray-600 mb-8">{message}</p>

            {/* Formulaire de renvoi */}
            <div className="bg-gray-50 rounded-xl p-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Renvoyer le lien de verification</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !resendEmail}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
                </button>
              </div>
              {resendSuccess && (
                <p className="text-green-600 text-sm mt-2">
                  Si un compte existe, un nouveau lien a ete envoye.
                </p>
              )}
            </div>
          </div>
        )}

        {/* No token (page d'attente apres inscription) */}
        {status === 'no-token' && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifiez votre email</h2>
            <p className="text-gray-600 mb-4">
              Un email de verification a ete envoye a votre adresse.
              Cliquez sur le lien dans l&apos;email pour activer votre compte.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r text-left mb-8">
              <p className="text-amber-800 text-sm">
                <strong>Vous ne trouvez pas l&apos;email ?</strong> Verifiez votre dossier spam.
                Le lien est valable 24 heures.
              </p>
            </div>

            {/* Formulaire de renvoi */}
            <div className="bg-gray-50 rounded-xl p-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Renvoyer le lien</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !resendEmail}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Renvoyer'}
                </button>
              </div>
              {resendSuccess && (
                <p className="text-green-600 text-sm mt-2">
                  Si un compte existe, un nouveau lien a ete envoye.
                </p>
              )}
            </div>

            <Link
              href={`/${locale}/auth/login`}
              className="inline-block mt-6 text-sm text-blue-600 hover:underline"
            >
              Retour a la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
