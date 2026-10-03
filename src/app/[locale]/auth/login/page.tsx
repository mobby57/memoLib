'use client';

import { SignIn } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const { locale = 'fr' } = useParams<{ locale?: string }>();
  const prefix = `/${locale}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-950 dark:bg-slate-900 dark:text-white">
      <SignIn
        forceRedirectUrl={`${prefix}/dashboard`}
        signUpUrl={`${prefix}/signup`}
        fallbackRedirectUrl={`${prefix}/dashboard`}
      />
    </main>
  );
}
