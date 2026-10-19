import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/clerk-auth';

export const metadata = { title: 'Email' };

export default async function EmailDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = await params;

  const { user } = await auth();
  if (!user?.tenantId) notFound();

  // Isolation stricte : un email d'un autre tenant → 404
  const email = await prisma.email.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!email) notFound();

  const from = email.fromAddress ?? email.from ?? '—';
  const date = email.receivedAt
    ? new Date(email.receivedAt).toLocaleString('fr-FR')
    : '—';
  // plain text prioritaire — pas de dangerouslySetInnerHTML sans sanitizer
  const body = email.bodyText ?? email.body ?? '(corps vide)';

  return (
    <main className="p-6 space-y-4">
      <Link
        href={`/${locale}/emails`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Retour aux emails
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {email.subject ?? '(sans sujet)'}
        </h1>
        <p className="text-sm text-gray-500">
          De : {from} — {date}
        </p>
      </header>
      <article className="prose max-w-none whitespace-pre-wrap rounded border p-4">
        {body}
      </article>
    </main>
  );
}
