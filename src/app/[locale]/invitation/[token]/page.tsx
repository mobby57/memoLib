'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SignInButton, useAuth } from '@clerk/nextjs';

export default function InvitationPage() {
  const { token } = useParams();
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('');
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId || typeof token !== 'string') return;
    const attemptKey = `${userId}:${token}`;
    if (attempted.current === attemptKey) return;
    attempted.current = attemptKey;

    async function acceptInvitation() {
      try {
        const res = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || data.error || 'Erreur lors de l\'acceptation');

        setStatus('success');
        setMessage('Invitation acceptée ! Redirection vers votre dossier...');
        setTimeout(() => router.push(`/fr/espace-client/${data.dossierId}`), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Erreur lors de l’acceptation');
      }
    }

    acceptInvitation();
  }, [isLoaded, userId, token, router]);

  if (!isLoaded) {
    return <div className="p-8 text-center">Vérification de l'invitation en cours...</div>;
  }

  if (!userId) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-20">
        <h2 className="text-xl font-bold mb-2">Connectez-vous pour accepter l’invitation</h2>
        <p className="mb-4">Utilisez le compte associé à l’adresse email qui a reçu l’invitation.</p>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Se connecter ou créer un compte</button>
        </SignInButton>
      </div>
    );
  }

  if (status === 'loading') {
    return <div className="p-8 text-center">Vérification de l'invitation en cours...</div>;
  }

  if (status === 'error') {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-20 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Accès refusé</h2>
        <p className="text-red-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-center max-w-md mx-auto mt-20 bg-green-50 border border-green-200 rounded-lg">
      <h2 className="text-xl font-bold text-green-700 mb-2">Succès</h2>
      <p className="text-green-600">{message}</p>
    </div>
  );
}
