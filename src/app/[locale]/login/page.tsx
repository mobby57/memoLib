import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// M3 — unification auth : /login redirige vers la route Clerk canonique /sign-in.
export default async function LoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/sign-in`);
}
