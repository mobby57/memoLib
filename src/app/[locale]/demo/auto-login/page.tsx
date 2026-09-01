'use client';

import { RedirectToSignIn, useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function DemoAutoLogin() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn redirectUrl="/fr/demo/complete" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-md rounded-2xl bg-white/95 p-8 text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">Chargement de la démo...</h1>
        <p className="text-gray-600">Connexion au cabinet de démonstration</p>
      </div>
    </main>
  );
}
