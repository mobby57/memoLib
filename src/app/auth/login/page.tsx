import { redirect } from 'next/navigation';

/**
 * Redirect /auth/login → /fr/auth/login
 * Literal route takes priority over [locale] dynamic segment.
 */
export default async function AuthLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(params).toString();
  redirect(query ? `/fr/auth/login?${query}` : '/fr/auth/login');
}
