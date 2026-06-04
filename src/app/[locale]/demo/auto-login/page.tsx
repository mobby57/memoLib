'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function DemoAutoLogin() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    signIn('credentials', {
      email: 'avocat@memolib.fr',
      password: 'demo123',
      callbackUrl: '/dashboard',
      redirect: true,
    }).catch(() => setError('Impossible de se connecter à la démo.'));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="bg-white/95 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:underline">Retour à l&apos;accueil</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="bg-white/95 rounded-2xl p-8 text-center max-w-md">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Chargement de la démo...</h1>
        <p className="text-gray-600">Connexion au cabinet de démonstration</p>
      </div>
    </div>
  );
}
