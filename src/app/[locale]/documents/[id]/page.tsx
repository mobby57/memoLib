import Link from 'next/link';

export const metadata = { title: 'Document' };

export default async function DocumentDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  // TODO: fetch /api/documents/${id}
  const doc = { id, nom: '—', type: '—', createdAt: '—' };

  return (
    <main className="p-6 space-y-4">
      <Link href={`/${locale}/documents`} className="text-sm text-blue-600 hover:underline">
        ← Retour aux documents
      </Link>
      <h1 className="text-2xl font-semibold">Document {doc.nom}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">ID</dt><dd>{doc.id}</dd>
        <dt className="text-gray-500">Type</dt><dd>{doc.type}</dd>
        <dt className="text-gray-500">Créé le</dt><dd>{doc.createdAt}</dd>
      </dl>
      <div className="flex gap-2">
        <a className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
           href={`/api/documents/${id}/download`}>Télécharger</a>
      </div>
    </main>
  );
}
