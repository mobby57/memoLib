import Link from 'next/link';

export default async function TenantDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  const tenant = { id, nom: '—', plan: '—', statut: '—' };

  return (
    <main className="p-6 space-y-4">
      <Link href={`/${locale}/super-admin/tenants`} className="text-sm text-blue-600 hover:underline">
        ← Retour aux tenants
      </Link>
      <h1 className="text-2xl font-semibold">Tenant {tenant.nom}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">ID</dt><dd>{tenant.id}</dd>
        <dt className="text-gray-500">Plan</dt><dd>{tenant.plan}</dd>
        <dt className="text-gray-500">Statut</dt><dd>{tenant.statut}</dd>
      </dl>
    </main>
  );
}
