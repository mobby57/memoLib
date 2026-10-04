import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// M3 — unification auth : /auth/login (legacy) redirige vers la route Clerk /sign-in.
export default async function LegacyLoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/sign-in`);
}
