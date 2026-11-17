'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Page de démo : redirige simplement vers le dashboard
// (La vraie authentification passe par /fr/auth/login)

export default function DemoAutoLogin() {
  const router = useRouter();

  useEffect(() => {
    router.push('/fr/dossiers');
  }, [router]);

  return (
    <div className="p-10 text-center text-slate-600">
      Redirection vers la démo...
    </div>
  );
}
