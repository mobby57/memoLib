import { redirect } from 'next/navigation';

// Force dynamic : pas de prerender statique (searchParams indisponible). Next 16.
export const dynamic = 'force-dynamic';

/**
 * Redirect /auth/register → /fr/sign-up (unification auth Clerk).
 */
export default async function AuthRegisterRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams(params).toString();
  redirect(query ? `/fr/sign-up?${query}` : '/fr/sign-up');
}
