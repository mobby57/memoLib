import { UserProfile } from '@clerk/nextjs';

interface SecuritySettingsPageProps {
  params: Promise<{
    locale: string;
    rest?: string[];
  }>;
}

export default async function SecuritySettingsPage({ params }: SecuritySettingsPageProps) {
  const { locale } = await params;
  const profilePath = `/${encodeURIComponent(locale)}/settings/security`;

  return (
    <main className="flex min-h-screen justify-center bg-slate-950 p-6">
      <section className="w-full max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold text-white">Sécurité du compte</h1>
        <p className="mb-6 text-slate-300">
          Gérez vos méthodes de connexion, y compris les passkeys disponibles sur vos appareils.
        </p>
        <UserProfile path={profilePath} routing="path" />
      </section>
    </main>
  );
}
