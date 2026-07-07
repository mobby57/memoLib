import { redirect } from 'next/navigation';

/**
 * Redirect /auth/register → /fr/auth/register
 * 
 * This page exists because Next.js 16's proxy (formerly middleware) doesn't 
 * intercept paths where the [locale] dynamic segment would match first.
 * Creating a literal /auth/register route takes priority over [locale]="auth".
 */
export default async function AuthRegisterRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(params).toString();
  const target = query ? `/fr/auth/register?${query}` : '/fr/auth/register';
  redirect(target);
}
