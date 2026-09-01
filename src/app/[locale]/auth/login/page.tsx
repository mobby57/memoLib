'use client';

import { SignIn } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const { locale = 'fr' } = useParams<{ locale?: string }>();
  const prefix = `/${locale}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <SignIn
        forceRedirectUrl={`${prefix}/dashboard`}
        signUpUrl={`${prefix}/sign-up`}
        fallbackRedirectUrl={`${prefix}/dashboard`}
      />
    </main>
  );
}
