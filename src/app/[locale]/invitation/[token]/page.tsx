'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function InvitationPage() {
  const { token } = useParams();
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoaded || !userId || !token) return;

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
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message);
      }
    }

    acceptInvitation();
  }, [isLoaded, userId, token, router]);

  if (!isLoaded || status === 'loading') {
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
