import { redirect } from 'next/navigation';

// Force dynamic : cette page ne doit pas être prérendue statiquement
// (searchParams indisponible au prerender -> erreur). Next 16.
export const dynamic = 'force-dynamic';

/**
 * Redirect /auth/login → /fr/sign-in (unification auth Clerk).
 */
export default async function AuthLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams(params).toString();
  redirect(query ? `/fr/sign-in?${query}` : '/fr/sign-in');
}
