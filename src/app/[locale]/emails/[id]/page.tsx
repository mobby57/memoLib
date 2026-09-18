import Link from 'next/link';

export const metadata = { title: 'Email' };

export default async function EmailDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  // TODO: fetch /api/emails/${id}
  const email = { id, from: '—', subject: '—', body: '—', date: '—' };

  return (
    <main className="p-6 space-y-4">
      <Link href={`/${locale}/emails`} className="text-sm text-blue-600 hover:underline">
        ← Retour aux emails
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{email.subject}</h1>
        <p className="text-sm text-gray-500">
          De : {email.from} — {email.date}
        </p>
      </header>
      <article className="prose max-w-none whitespace-pre-wrap rounded border p-4">
        {email.body}
      </article>
    </main>
  );
}
