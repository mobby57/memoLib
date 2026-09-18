import Link from 'next/link';

export const metadata = { title: 'Mes dossiers' };

export default async function ClientDossiersPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const dossiers: Array<{ id: string; reference: string; statut?: string }> = [];

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes dossiers</h1>
        <Link
          href={`/${locale}/client/dossiers/nouveau`}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Nouveau dossier
        </Link>
      </header>
      {dossiers.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun dossier pour le moment.</p>
      ) : (
        <ul className="divide-y rounded border">
          {dossiers.map((d) => (
            <li key={d.id} className="p-3">
              <Link
                href={`/${locale}/client/dossiers/${d.id}`}
                className="text-blue-600 hover:underline"
              >
                {d.reference}
              </Link>
              {d.statut && <span className="ml-2 text-xs text-gray-500">{d.statut}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
