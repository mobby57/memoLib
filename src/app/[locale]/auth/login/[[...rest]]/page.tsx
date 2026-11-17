'use client';

import { SignIn } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl rounded-2xl',
          },
        }}
        routing="path"
        path={`/${locale}/auth/login`}
        signUpUrl={`/${locale}/auth/sign-up`}
        fallbackRedirectUrl={`/${locale}/dossiers`}
      />
    </div>
  );
}
