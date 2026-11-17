'use client';
import { SignIn } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

export default function SignInPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <SignIn
        appearance={{ elements: { rootBox: 'mx-auto', card: 'shadow-xl rounded-2xl' } }}
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        fallbackRedirectUrl={`/${locale}/dossiers`}
      />
    </div>
  );
}