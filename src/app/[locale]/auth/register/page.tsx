import { redirect } from 'next/navigation';

// M3 — unification auth : /auth/register (legacy) redirige vers la route Clerk /sign-up.
export default async function LegacyRegisterRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/sign-up`);
}
